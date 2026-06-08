import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CancelOrderRequest,
  CreateOrderRequest,
  ListOrdersQuery,
  UpdateOrderPassengersRequest,
  UpdateOrderSeatLabelsRequest,
} from './order.dto';

@Injectable()
export class OrderService {
  constructor(
    @Inject('order_service') private readonly orderClient: ClientProxy,
  ) {}

  health() {
    return this.orderClient.send('orders.health', {});
  }

  create(payload: CreateOrderRequest) {
    return this.orderClient.send('orders.create', payload);
  }

  list(query: ListOrdersQuery) {
    return this.orderClient.send('orders.list', query);
  }

  findOne(data: { orderId: string }) {
    return this.orderClient.send('orders.findOne', data);
  }

  summary(data: { orderId: string }) {
    return this.orderClient.send('orders.summary', data);
  }

  updatePassengers(data: {
    orderId: string;
    payload: UpdateOrderPassengersRequest;
  }) {
    return this.orderClient.send('orders.updatePassengers', data);
  }

  updateSeatLabels(data: {
    orderId: string;
    payload: UpdateOrderSeatLabelsRequest;
  }) {
    return this.orderClient.send('orders.updateSeatLabels', data);
  }

  markPendingPayment(data: { orderId: string }) {
    return this.orderClient.send('orders.markPendingPayment', data);
  }

  markPaid(data: { orderId: string }) {
    return this.orderClient.send('orders.markPaid', data);
  }

  confirm(data: { orderId: string }) {
    return this.orderClient.send('orders.confirm', data);
  }

  issueTicket(data: { orderId: string }) {
    return this.orderClient.send('orders.issueTicket', data);
  }

  cancel(data: { orderId: string; payload?: CancelOrderRequest }) {
    return this.orderClient.send('orders.cancel', data);
  }

  expire(data: { orderId: string }) {
    return this.orderClient.send('orders.expire', data);
  }

  refund(data: { orderId: string }) {
    return this.orderClient.send('orders.refund', data);
  }

  remove(data: { orderId: string }) {
    return this.orderClient.send('orders.remove', data);
  }
}
