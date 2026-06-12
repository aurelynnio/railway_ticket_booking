import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import type {
  PaymentDto,
  PaymentPaidEventPayload,
  TicketItemSnapshot,
  TicketSnapshot,
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
} from './utils/orders.utils';

type OrderRecord = OrderResponse;

@Injectable()
export class OrdersService {
  constructor(
    @Inject('payment_service') private readonly paymentClient: ClientProxy,
    @Inject('ticket_service') private readonly ticketClient: ClientProxy,
  ) {}

  private readonly orders: OrderRecord[] = [];

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
    let order: OrderResponse | null = null;

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

      order = this.create({
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
      if (order) {
        await this.tryCancelCompensatingOrder(order.id);
      }

      await this.releaseReservation(
        payload.ticketId,
        payload.ticketItemId,
        reservedSeatLabels,
        reservedQuantity,
      );

      throw error;
    }
  }

  /*
   * Normalize the incoming order payload and derive computed fields once
   * so every later status transition works on a consistent order snapshot.
   */
  create(payload: CreateOrderRequest): OrderResponse {
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

    const now = new Date().toISOString();
    const order: OrderRecord = {
      id: randomUUID(),
      userId: payload.userId.trim(),
      ticketItemId: payload.ticketItemId.trim(),
      ticketId: payload.ticketId.trim(),
      ticketTitle: payload.ticketTitle.trim(),
      trainNumber: toNullableString(payload.trainNumber),
      departureStationCode: toNullableString(payload.departureStationCode),
      departureStationName: toNullableString(payload.departureStationName),
      arrivalStationCode: toNullableString(payload.arrivalStationCode),
      arrivalStationName: toNullableString(payload.arrivalStationName),
      departureTime: toNullableDate(payload.departureTime, 'departureTime'),
      arrivalTime: toNullableDate(payload.arrivalTime, 'arrivalTime'),
      coachCode: toNullableString(payload.coachCode),
      seatClass: toNullableString(payload.seatClass),
      seatType: toNullableString(payload.seatType),
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      ticketCode: null,
      qrPayload: null,
      status: OrderStatus.PendingPayment,
      seatLabels,
      passengers,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.orders.unshift(order);
    return order;
  }

  /*
   * Apply soft-delete aware filters first, then paginate the surviving orders
   * so the returned counts and slices stay aligned with the query criteria.
   */
  list(query: ListOrdersQuery = {}): PaginatedOrdersResponse {
    const page = normalizePageValue(query.page, 1);
    const limit = normalizePageValue(query.limit, 10);
    const status = normalizeOptionalStatus(query.status);
    const filtered = this.orders.filter((order) => {
      if (order.deletedAt) {
        return false;
      }
      if (query.userId?.trim() && order.userId !== query.userId.trim()) {
        return false;
      }
      if (query.ticketId?.trim() && order.ticketId !== query.ticketId.trim()) {
        return false;
      }
      if (
        query.ticketItemId?.trim() &&
        order.ticketItemId !== query.ticketItemId.trim()
      ) {
        return false;
      }
      if (
        query.ticketCode?.trim() &&
        order.ticketCode !== query.ticketCode.trim()
      ) {
        return false;
      }
      if (status !== undefined && order.status !== status) {
        return false;
      }

      return true;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;

    return {
      data: filtered.slice(startIndex, startIndex + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  findOne(orderId: string): OrderResponse {
    return this.getOrderOrThrow(orderId);
  }

  summary(orderId: string): OrderSummaryResponse {
    const order = this.getOrderOrThrow(orderId);

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

  updatePassengers(
    orderId: string,
    payload: UpdateOrderPassengersRequest,
  ): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    this.ensureMutable(order);

    const passengers = normalizePassengers(payload.passengers);
    if (passengers.length > order.quantity) {
      throw new HttpException(
        'passengers cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    order.passengers = passengers;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  updateSeatLabels(
    orderId: string,
    payload: UpdateOrderSeatLabelsRequest,
  ): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    this.ensureMutable(order);

    const seatLabels = normalizeSeatLabels(payload.seatLabels);
    if (seatLabels.length > order.quantity) {
      throw new HttpException(
        'seatLabels cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      );
    }

    order.seatLabels = seatLabels;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  markPendingPayment(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.PendingPayment, [
      OrderStatus.Draft,
      OrderStatus.PendingPayment,
      OrderStatus.Expired,
    ]);
  }

  markPaid(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Paid, [
      OrderStatus.PendingPayment,
    ]);
  }

  handlePaymentPaidEvent(payload: PaymentPaidEventPayload) {
    const order = this.getOrderOrThrow(payload.orderId);
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
      currentOrder = this.markPaid(currentOrder.id);
      advancedOrderStatuses.push(currentOrder.status);
    }

    if (currentOrder.status === OrderStatus.Paid) {
      currentOrder = this.confirm(currentOrder.id);
      advancedOrderStatuses.push(currentOrder.status);
    }

    if (currentOrder.status === OrderStatus.Confirmed) {
      currentOrder = this.issueTicket(currentOrder.id);
      advancedOrderStatuses.push(currentOrder.status);
    }

    return {
      order: currentOrder,
      advancedOrderStatuses,
    };
  }

  confirm(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Confirmed, [
      OrderStatus.Paid,
      OrderStatus.TicketIssued,
    ]);
  }

  /*
   * Ticket issuance is the point where a paid order gains immutable travel
   * artifacts, so the code lazily generates them exactly once.
   */
  issueTicket(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);

    if (![OrderStatus.Paid, OrderStatus.Confirmed].includes(order.status)) {
      throw new HttpException(
        'Only paid or confirmed orders can issue ticket',
        HttpStatus.CONFLICT,
      );
    }

    order.status = OrderStatus.TicketIssued;
    order.ticketCode ??= buildTicketCode(order);
    order.qrPayload ??= buildQrPayload(order);
    order.updatedAt = new Date().toISOString();

    return order;
  }

  cancel(
    orderId: string,
    payload: CancelOrderRequest = {},
  ): CancelledOrderResponse {
    const order = this.getOrderOrThrow(orderId);

    if (
      [
        OrderStatus.Cancelled,
        OrderStatus.Expired,
        OrderStatus.Refunded,
      ].includes(order.status)
    ) {
      throw new HttpException('Order is already closed', HttpStatus.CONFLICT);
    }

    order.status = OrderStatus.Cancelled;
    order.updatedAt = new Date().toISOString();

    return {
      ...order,
      cancelReason: toNullableString(payload.reason),
    };
  }

  async cancelWorkflow(data: {
    orderId: string;
    payload?: CancelOrderRequest;
  }): Promise<CancelOrderWorkflowResponse> {
    const order = this.findOne(data.orderId);
    const cancelledOrder = this.cancel(data.orderId, data.payload);
    const warnings: string[] = [];
    const cancelledPaymentIds = await this.cancelPendingPayments(
      order.id,
      warnings,
    );

    try {
      await this.releaseReservation(
        order.ticketId,
        order.ticketItemId,
        order.seatLabels,
        Math.max(0, order.quantity - order.seatLabels.length),
      );
    } catch (error) {
      warnings.push(this.getErrorMessage(error));
    }

    return {
      order: cancelledOrder,
      releasedSeatLabels: order.seatLabels,
      releasedQuantity: order.quantity,
      cancelledPaymentIds,
      warnings,
    };
  }

  expire(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Expired, [
      OrderStatus.PendingPayment,
    ]);
  }

  refund(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Refunded, [
      OrderStatus.Paid,
      OrderStatus.Confirmed,
      OrderStatus.TicketIssued,
    ]);
  }

  remove(orderId: string) {
    const order = this.getOrderOrThrow(orderId);
    order.deletedAt = new Date().toISOString();
    order.updatedAt = order.deletedAt;

    return {
      message: `Order ${orderId} has been deleted`,
    };
  }

  private getOrderOrThrow(orderId: string): OrderRecord {
    assertRequired(orderId, 'orderId');

    const order = this.orders.find(
      (entry) => entry.id === orderId.trim() && entry.deletedAt === null,
    );

    if (!order) {
      throw new HttpException(
        `Order ${orderId} was not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return order;
  }

  private transitionStatus(
    order: OrderRecord,
    nextStatus: OrderStatus,
    allowedCurrentStatuses: OrderStatus[],
  ): OrderResponse {
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

    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  private ensureMutable(order: OrderRecord) {
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
    for (const seatLabel of seatLabels) {
      await this.sendTicket(
        { cmd: 'tickets.reserve_seat' },
        { ticketId, ticketItemId, payload: { seatLabel } },
      );
      reservedSeatLabels.push(seatLabel);
    }

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
  ) {
    for (const seatLabel of seatLabels) {
      await this.sendTicket(
        { cmd: 'tickets.release_seat' },
        { ticketId, ticketItemId, payload: { seatLabel } },
      );
    }

    if (quantity > 0) {
      await this.sendTicket(
        { cmd: 'tickets.release' },
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

      const pendingPayments = payments.filter((payment) =>
        [0, 1].includes(payment.status),
      );

      const cancelledPaymentIds: string[] = [];
      for (const payment of pendingPayments) {
        try {
          await this.sendPayment('payments.cancel', { id: payment.id });
          cancelledPaymentIds.push(payment.id);
        } catch (error) {
          warnings.push(
            `cancel payment ${payment.id}: ${this.getErrorMessage(error)}`,
          );
        }
      }

      return cancelledPaymentIds;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return [];
      }

      warnings.push(`load payments: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  private async tryCancelCompensatingOrder(orderId: string) {
    try {
      this.cancel(orderId, {
        reason: 'Checkout rollback after downstream failure',
      });
    } catch {}
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

  private isNotFoundError(error: unknown) {
    const status =
      typeof error === 'object' && error !== null
        ? ((error as { status?: number }).status ??
          (error as { response?: { statusCode?: number } }).response
            ?.statusCode)
        : undefined;

    return status === HttpStatus.NOT_FOUND;
  }

  private getErrorMessage(error: unknown) {
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
}
