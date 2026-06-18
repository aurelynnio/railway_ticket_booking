import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import type {
  PaymentPaidEventPayload,
  PaymentDto,
  TicketSnapshot,
  TicketItemSnapshot,
} from './orders.contracts';
import type {
  CancelOrderWorkflowResponse,
  CancelOrderRequest,
  CancelledOrderResponse,
  CheckoutOrderRequest,
  CreateOrderRequest,
  ListOrdersQuery,
  OrderCheckoutResponse,
  OrderResponse,
  OrderSummaryResponse,
  PaginatedOrdersResponse,
  UpdateOrderPassengersRequest,
  UpdateOrderSeatLabelsRequest,
} from './orders.dto';
import { OrderStatus } from './orders.dto';
import {
  assertRequired,
  buildQrPayload,
  buildTicketCode,
  normalizeNonNegativeInteger,
  normalizeOptionalStatus,
  normalizePageValue,
  normalizePassengers,
  normalizePositiveInteger,
  normalizeSeatLabels,
  toNullableDate,
  toNullableString,
  toOrderResponse,
  type OrderWithRelations,
} from './utils/orders.utils';

const orderInclude = {
  seatLabels: true,
  passengers: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject('payment_service') private readonly paymentClient: ClientProxy,
    @Inject('ticket_service') private readonly ticketClient: ClientProxy,
  ) {}

  health() {
    return {
      service: 'orders-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async checkout(
    payload: CheckoutOrderRequest,
  ): Promise<OrderCheckoutResponse> {
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

      const order = await this.create({
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

  /*
   * Normalize the incoming order payload and derive computed fields once
   * so every later status transition works on a consistent order snapshot.
   */
  async create(payload: CreateOrderRequest): Promise<OrderResponse> {
    assertRequired(payload.userId, 'userId');
    assertRequired(payload.ticketId, 'ticketId');
    assertRequired(payload.ticketItemId, 'ticketItemId');
    assertRequired(payload.ticketTitle, 'ticketTitle');

    const quantity = normalizePositiveInteger(payload.quantity, 'quantity');
    const unitPrice = normalizeNonNegativeInteger(
      payload.unitPrice,
      'unitPrice',
    );
    const seatLabels = normalizeSeatLabels(payload.seatLabels);
    const passengers = normalizePassengers(payload.passengers);

    if (seatLabels.length > quantity) {
      throw new HttpException(
        'seatLabels cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (passengers.length > quantity) {
      throw new HttpException(
        'passengers cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    const departureTime = toNullableDate(
      payload.departureTime,
      'departureTime',
    );
    const arrivalTime = toNullableDate(payload.arrivalTime, 'arrivalTime');

    const order = await this.prisma.order.create({
      data: {
        userId: payload.userId.trim(),
        ticketItemId: payload.ticketItemId.trim(),
        ticketId: payload.ticketId.trim(),
        ticketTitle: payload.ticketTitle.trim(),
        trainNumber: toNullableString(payload.trainNumber),
        departureStationCode: toNullableString(payload.departureStationCode),
        departureStationName: toNullableString(payload.departureStationName),
        arrivalStationCode: toNullableString(payload.arrivalStationCode),
        arrivalStationName: toNullableString(payload.arrivalStationName),
        departureTime: departureTime ? new Date(departureTime) : null,
        arrivalTime: arrivalTime ? new Date(arrivalTime) : null,
        coachCode: toNullableString(payload.coachCode),
        seatClass: toNullableString(payload.seatClass),
        seatType: toNullableString(payload.seatType),
        quantity,
        unitPrice: BigInt(unitPrice),
        totalPrice: BigInt(quantity * unitPrice),
        status: OrderStatus.PendingPayment,
        seatLabels: {
          create: seatLabels.map((seatLabel) => ({ seatLabel })),
        },
        passengers: {
          create: passengers.map((passenger) => ({
            fullName: passenger.fullName,
            passengerType: passenger.passengerType,
            identityNumber: passenger.identityNumber,
            phoneNumber: passenger.phoneNumber,
          })),
        },
      },
      include: orderInclude,
    });

    return toOrderResponse(order);
  }

  /*
   * Apply soft-delete aware filters first, then paginate the surviving orders
   * so the returned counts and slices stay aligned with the query criteria.
   */
  async list(query: ListOrdersQuery = {}): Promise<PaginatedOrdersResponse> {
    const page = normalizePageValue(query.page, 1);
    const limit = normalizePageValue(query.limit, 10);
    const status = normalizeOptionalStatus(query.status);
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
    };

    if (query.userId?.trim()) {
      where.userId = query.userId.trim();
    }
    if (query.ticketId?.trim()) {
      where.ticketId = query.ticketId.trim();
    }
    if (query.ticketItemId?.trim()) {
      where.ticketItemId = query.ticketItemId.trim();
    }
    if (query.ticketCode?.trim()) {
      where.ticketCode = query.ticketCode.trim();
    }
    if (status !== undefined) {
      where.status = status;
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: orders.map(toOrderResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(orderId: string): Promise<OrderResponse> {
    return toOrderResponse(await this.getOrderOrThrow(orderId));
  }

  async summary(orderId: string): Promise<OrderSummaryResponse> {
    const order = await this.findOne(orderId);

    return {
      orderId: order.id,
      userId: order.userId,
      ticketId: order.ticketId,
      ticketItemId: order.ticketItemId,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      seatCount: order.seatLabels.length,
      passengerCount: order.passengers.length,
      status: order.status,
      ticketIssued: Boolean(order.ticketCode && order.qrPayload),
    };
  }

  async updatePassengers(
    orderId: string,
    payload: UpdateOrderPassengersRequest,
  ): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    this.ensureMutable(order);

    const passengers = normalizePassengers(payload.passengers);
    if (passengers.length > order.quantity) {
      throw new HttpException(
        'passengers cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction([
      this.prisma.orderPassenger.deleteMany({ where: { orderId: order.id } }),
      ...passengers.map((passenger) =>
        this.prisma.orderPassenger.create({
          data: {
            orderId: order.id,
            fullName: passenger.fullName,
            passengerType: passenger.passengerType,
            identityNumber: passenger.identityNumber,
            phoneNumber: passenger.phoneNumber,
          },
        }),
      ),
      this.prisma.order.update({
        where: { id: order.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    return this.findOne(order.id);
  }

  async updateSeatLabels(
    orderId: string,
    payload: UpdateOrderSeatLabelsRequest,
  ): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    this.ensureMutable(order);

    const seatLabels = normalizeSeatLabels(payload.seatLabels);
    if (seatLabels.length > order.quantity) {
      throw new HttpException(
        'seatLabels cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction([
      this.prisma.orderSeatLabel.deleteMany({ where: { orderId: order.id } }),
      ...seatLabels.map((seatLabel) =>
        this.prisma.orderSeatLabel.create({
          data: {
            orderId: order.id,
            seatLabel,
          },
        }),
      ),
      this.prisma.order.update({
        where: { id: order.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    return this.findOne(order.id);
  }

  async markPendingPayment(orderId: string): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.PendingPayment, [
      OrderStatus.Draft,
      OrderStatus.PendingPayment,
      OrderStatus.Expired,
    ]);
  }

  async markPaid(orderId: string): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Paid, [
      OrderStatus.PendingPayment,
    ]);
  }

  async handlePaymentPaidEvent(payload: PaymentPaidEventPayload) {
    const order = toOrderResponse(await this.getOrderOrThrow(payload.orderId));
    const advancedOrderStatuses: number[] = [];

    if (
      [
        OrderStatus.Cancelled,
        OrderStatus.Expired,
        OrderStatus.Refunded,
        OrderStatus.TicketIssued,
      ].includes(order.status)
    ) {
      return {
        order,
        advancedOrderStatuses,
      };
    }

    let currentOrder = order;

    if (currentOrder.status === OrderStatus.PendingPayment) {
      currentOrder = await this.markPaid(currentOrder.id);
      advancedOrderStatuses.push(currentOrder.status);
    }

    if (currentOrder.status === OrderStatus.Paid) {
      currentOrder = await this.confirm(currentOrder.id);
      advancedOrderStatuses.push(currentOrder.status);
    }

    if (currentOrder.status === OrderStatus.Confirmed) {
      currentOrder = await this.issueTicket(currentOrder.id);
      advancedOrderStatuses.push(currentOrder.status);
    }

    return {
      order: currentOrder,
      advancedOrderStatuses,
    };
  }

  async confirm(orderId: string): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Confirmed, [
      OrderStatus.Paid,
      OrderStatus.TicketIssued,
    ]);
  }

  /*
   * Ticket issuance is the point where a paid order gains immutable travel
   * artifacts, so the code lazily generates them exactly once.
   */
  async issueTicket(orderId: string): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);

    if (![OrderStatus.Paid, OrderStatus.Confirmed].includes(order.status)) {
      throw new HttpException(
        'Only paid or confirmed orders can issue ticket',
        HttpStatus.CONFLICT,
      );
    }

    const orderResponse = toOrderResponse(order);
    const ticketCode = order.ticketCode ?? buildTicketCode(orderResponse);
    const qrPayload =
      order.qrPayload ?? buildQrPayload({ ...orderResponse, ticketCode });

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.TicketIssued,
        ticketCode,
        qrPayload,
      },
      include: orderInclude,
    });

    return toOrderResponse(updated);
  }

  async cancel(
    orderId: string,
    payload: CancelOrderRequest = {},
  ): Promise<CancelledOrderResponse> {
    const order = await this.getOrderOrThrow(orderId);

    if (
      [
        OrderStatus.Cancelled,
        OrderStatus.Expired,
        OrderStatus.Refunded,
      ].includes(order.status)
    ) {
      throw new HttpException('Order is already closed', HttpStatus.CONFLICT);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.Cancelled,
      },
      include: orderInclude,
    });

    return {
      ...toOrderResponse(updated),
      cancelReason: toNullableString(payload.reason),
    };
  }

  async cancelWorkflow(data: {
    orderId: string;
    payload?: CancelOrderRequest;
  }): Promise<CancelOrderWorkflowResponse> {
    const order = await this.findOne(data.orderId);
    const cancelledOrder = await this.cancel(data.orderId, data.payload);
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

  async expire(orderId: string): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Expired, [
      OrderStatus.PendingPayment,
    ]);
  }

  async refund(orderId: string): Promise<OrderResponse> {
    const order = await this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Refunded, [
      OrderStatus.Paid,
      OrderStatus.Confirmed,
      OrderStatus.TicketIssued,
    ]);
  }

  async remove(orderId: string) {
    const order = await this.getOrderOrThrow(orderId);
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      message: `Order ${orderId} has been deleted`,
    };
  }

  private async getOrderOrThrow(orderId: string): Promise<OrderWithRelations> {
    assertRequired(orderId, 'orderId');
    const normalizedOrderId = orderId.trim();

    const order = await this.prisma.order.findFirst({
      where: {
        id: normalizedOrderId,
        deletedAt: null,
      },
      include: orderInclude,
    });

    if (!order) {
      throw new HttpException(
        `Order ${orderId} was not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return order;
  }

  private async transitionStatus(
    order: OrderWithRelations,
    nextStatus: OrderStatus,
    allowedCurrentStatuses: OrderStatus[],
  ): Promise<OrderResponse> {
    /*
     * Keep lifecycle rules in one place so every public status-changing method
     * enforces the same transition guard and timestamp update.
     */
    if (!allowedCurrentStatuses.includes(order.status)) {
      throw new HttpException(
        `Cannot move order from status ${order.status} to ${nextStatus}`,
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
      include: orderInclude,
    });

    return toOrderResponse(updated);
  }

  private ensureMutable(order: OrderWithRelations) {
    if (
      [
        OrderStatus.Cancelled,
        OrderStatus.Expired,
        OrderStatus.Refunded,
      ].includes(order.status)
    ) {
      throw new HttpException(
        'Closed orders cannot be modified',
        HttpStatus.CONFLICT,
      );
    }
  }

  // =========================================================================
  // HELPER SAGA ORCHESTRATION METHODS (Merged back from CheckoutSagaOrchestrator)
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
      await this.cancel(orderId, {
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
