import { HttpException, HttpStatus, Injectable, forwardRef, Inject } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { CheckoutSagaOrchestrator } from './checkout-saga.orchestrator';
import type {
  PaymentPaidEventPayload,
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
    @Inject(forwardRef(() => CheckoutSagaOrchestrator))
    private readonly sagaOrchestrator: CheckoutSagaOrchestrator,
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
    return this.sagaOrchestrator.checkout(payload);
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
    return this.sagaOrchestrator.cancelWorkflow(data);
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

}
