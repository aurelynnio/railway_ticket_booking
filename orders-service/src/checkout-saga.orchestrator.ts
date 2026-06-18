import { Inject, Injectable, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { OrdersService } from './orders.service';
import type { PaymentDto, TicketItemSnapshot, TicketSnapshot } from './orders.contracts';
import {
  CheckoutOrderRequest,
  CreateOrderRequest,
  CancelOrderRequest,
  OrderCheckoutResponse,
  CancelOrderWorkflowResponse,
} from './orders.dto';

@Injectable()
export class CheckoutSagaOrchestrator {
  constructor(
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaClient,
    @Inject('payment_service') private readonly paymentClient: ClientProxy,
    @Inject('ticket_service') private readonly ticketClient: ClientProxy,
  ) {}

  async checkout(payload: CheckoutOrderRequest): Promise<OrderCheckoutResponse> {
    if (payload.seatLabels && payload.seatLabels.length > payload.quantity) {
      throw new HttpException(
        'seatLabels cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    const ticket = await this.findTicket(payload.ticketId);
    const ticketItem = await this.findTicketItem(
      payload.ticketId,
      payload.ticketItemId,
    );
    const normalizedSeatLabels = payload.seatLabels ?? [];
    const reservedSeatLabels: string[] = [];
    let reservedQuantity = 0;
    let orderId: string | null = null;

    try {
      await this.reserveInventory(
        payload.ticketId,
        payload.ticketItemId,
        payload.quantity,
        normalizedSeatLabels,
        reservedSeatLabels,
        (quantity) => {
          reservedQuantity += quantity;
        },
      );

      const order = await this.ordersService.create({
        userId: payload.userId,
        ticketId: ticket.id,
        ticketItemId: ticketItem.id,
        ticketTitle: ticket.title ?? 'Untitled ticket',
        trainNumber: ticket.trainNumber,
        departureStationCode: ticket.departureStationCode,
        departureStationName: ticket.departureStationName,
        arrivalStationCode: ticket.arrivalStationCode,
        arrivalStationName: ticket.arrivalStationName,
        departureTime: ticket.dateStart,
        arrivalTime: ticket.dateEnd,
        coachCode: ticketItem.coachCode,
        seatClass: ticketItem.seatClass,
        seatType: ticketItem.seatType,
        quantity: payload.quantity,
        unitPrice: ticketItem.priceFlash ?? ticketItem.priceOriginal ?? 0,
        seatLabels: normalizedSeatLabels,
        passengers: payload.passengers,
      } satisfies CreateOrderRequest);

      orderId = order.id;

      const payment = await this.createPayment({
        orderId: order.id,
        userId: order.userId,
        amount: String(order.totalPrice),
        paymentMethod: payload.paymentMethod?.trim() || 'MANUAL',
      });

      return {
        order,
        payment,
        reservation: {
          ticketId: order.ticketId,
          ticketItemId: order.ticketItemId,
          reservedSeatLabels,
          reservedQuantity: reservedSeatLabels.length + reservedQuantity,
        },
      };
    } catch (error) {
      if (orderId) {
        await this.tryCancelCompensatingOrder(orderId);
      }

      try {
        await this.retry(
          () =>
            this.releaseReservation(
              payload.ticketId,
              payload.ticketItemId,
              reservedSeatLabels,
              reservedQuantity,
            ),
          3,
          500,
        );
      } catch (releaseError) {
        console.error(
          `CRITICAL distributed transaction compensation failure: Failed to release seats [${reservedSeatLabels.join(
            ', ',
          )}] for ticket ${payload.ticketId}. Error: ${this.getErrorMessage(
            releaseError,
          )}`,
        );
      }

      throw error;
    }
  }

  async cancelWorkflow(data: {
    orderId: string;
    payload?: CancelOrderRequest;
  }): Promise<CancelOrderWorkflowResponse> {
    const order = await this.ordersService.findOne(data.orderId);
    const cancelledOrder = await this.ordersService.cancel(data.orderId, data.payload);
    const warnings: string[] = [];
    const cancelledPaymentIds = await this.cancelPendingPayments(
      order.id,
      warnings,
    );

    try {
      await this.retry(
        () =>
          this.releaseReservation(
            order.ticketId,
            order.ticketItemId,
            order.seatLabels,
            Math.max(0, order.quantity - order.seatLabels.length),
          ),
        3,
        500,
      );
    } catch (error) {
      warnings.push(this.getErrorMessage(error));
      console.error(
        `CRITICAL distributed transaction compensation failure in cancelWorkflow for order ${order.id}. Error: ${this.getErrorMessage(
          error,
        )}`,
      );
    }

    return {
      order: cancelledOrder,
      releasedSeatLabels: order.seatLabels,
      releasedQuantity: order.quantity,
      cancelledPaymentIds,
      warnings,
    };
  }

  // =========================================================================
  // HELPER SAGA ORCHESTRATION METHODS (Moved from OrdersService)
  // =========================================================================

  private async findTicket(ticketId: string) {
    return this.sendTicket<TicketSnapshot>(
      { cmd: 'tickets.find_one' },
      { ticketId },
    );
  }

  private async findTicketItem(ticketId: string, ticketItemId: string) {
    return this.sendTicket<TicketItemSnapshot>(
      { cmd: 'tickets.find_ticket_item' },
      { ticketId, ticketItemId },
    );
  }

  private async createPayment(payload: {
    orderId: string;
    userId: string;
    amount: string;
    paymentMethod: string;
  }) {
    return this.sendPayment<PaymentDto>('payments.create', payload);
  }

  private async reserveInventory(
    ticketId: string,
    ticketItemId: string,
    quantity: number,
    seatLabels: string[],
    reservedSeatLabels: string[],
    onReservedQuantity: (quantity: number) => void,
  ) {
    const reserveSeatPromises = seatLabels.map(
      async (seatLabel: string): Promise<string> => {
        await this.sendTicket(
          {
            cmd: 'tickets.reserve_seat',
          },
          {
            ticketId,
            ticketItemId,
            payload: { seatLabel },
          },
        );
        return seatLabel;
      },
    );

    const reservedSeats = await Promise.all(reserveSeatPromises);
    reservedSeatLabels.push(...reservedSeats);

    const remainingQuantity = quantity - seatLabels.length;
    if (remainingQuantity > 0) {
      await this.sendTicket(
        { cmd: 'tickets.reserve' },
        {
          ticketId,
          payload: {
            ticketItemId,
            quantity: remainingQuantity,
          },
        },
      );
      onReservedQuantity(remainingQuantity);
    }
  }

  private async releaseReservation(
    ticketId: string,
    ticketItemId: string,
    seatLabels: string[],
    quantity: number,
  ): Promise<void> {
    const releaseSeatPromises = seatLabels.map(
      (seatLabel: string): Promise<unknown> =>
        this.sendTicket(
          {
            cmd: 'tickets.release_seat',
          },
          {
            ticketId,
            ticketItemId,
            payload: { seatLabel },
          },
        ),
    );
    await Promise.all(releaseSeatPromises);

    if (quantity > 0) {
      await this.sendTicket(
        {
          cmd: 'tickets.release',
        },
        {
          ticketId,
          payload: {
            ticketItemId,
            quantity,
          },
        },
      );
    }
  }

  private async cancelPendingPayments(
    orderId: string,
    warnings: string[],
  ): Promise<string[]> {
    try {
      const payments = await this.sendPayment<PaymentDto[]>(
        'payments.listByOrderId',
        { orderId },
      );

      const pendingPayments = payments.filter((payment: PaymentDto): boolean =>
        [0, 1].includes(payment.status),
      );

      const pendingPaymentIds = pendingPayments.map(
        (p: PaymentDto): string => p.id,
      );

      await this.sendPayment('payments.cancel', { id: pendingPaymentIds });

      return pendingPaymentIds;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return [];
      }

      warnings.push(`load payments: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  private async tryCancelCompensatingOrder(orderId: string): Promise<void> {
    try {
      await this.ordersService.cancel(orderId, {
        reason: 'Checkout rollback after downstream failure',
      });
    } catch {
      return;
    }
  }

  private async sendPayment<T>(pattern: string, payload: unknown): Promise<T> {
    return lastValueFrom(this.paymentClient.send<T>(pattern, payload));
  }

  private async sendTicket<T>(
    pattern: { cmd: string },
    payload: unknown,
  ): Promise<T> {
    return lastValueFrom(this.ticketClient.send<T>(pattern, payload));
  }

  private isNotFoundError(error: unknown): boolean {
    const status =
      typeof error === 'object' && error !== null
        ? ((error as { status?: number }).status ??
          (error as { response?: { statusCode?: number } }).response
            ?.statusCode)
        : undefined;

    return status === HttpStatus.NOT_FOUND;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const response = (error as { response?: { message?: unknown } }).response;
      if (typeof response?.message === 'string') {
        return response.message;
      }
      if (Array.isArray(response?.message)) {
        return response.message.join(', ');
      }
    }

    return 'Unknown downstream error';
  }

  private async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = (process.env.NODE_ENV === 'test' || typeof (global as any).jest !== 'undefined') ? 0 : 500,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retry(
        fn,
        retries - 1,
        (process.env.NODE_ENV === 'test' || typeof (global as any).jest !== 'undefined') ? 0 : delay * 2,
      );
    }
  }
}
