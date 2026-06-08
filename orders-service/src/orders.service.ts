import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type {
  CancelOrderRequest,
  CancelledOrderResponse,
  CreateOrderRequest,
  ListOrdersQuery,
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
  private readonly orders: OrderRecord[] = [];

  health() {
    return {
      service: 'orders-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /*
   * This method creates a new order based on the provided payload
   * It performs serverla validations on the input data, such as checking for required fields, ensuring numeric values are within expected ranges, and validating the lengths of arrays
   * If any validation fails, it throws an HttpException with an appropriate error message and status code
   * */
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

  confirm(orderId: string): OrderResponse {
    const order = this.getOrderOrThrow(orderId);
    return this.transitionStatus(order, OrderStatus.Confirmed, [
      OrderStatus.Paid,
      OrderStatus.TicketIssued,
    ]);
  }

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
}
