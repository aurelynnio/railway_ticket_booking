import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import type { PaymentPaidEventPayload } from './order.contracts';
import {
  CancelOrderRequest,
  CheckoutOrderRequest,
  CreateOrderRequest,
  ListOrdersQuery,
  OrderResponse,
  UpdateOrderPassengersRequest,
  UpdateOrderSeatLabelsRequest,
} from './order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern('orders.health')
  health() {
    return this.orderService.health();
  }

  @MessagePattern('orders.create')
  create(@Payload() payload: CreateOrderRequest) {
    return this.orderService.create(payload);
  }

  @MessagePattern('orders.checkout')
  checkout(@Payload() payload: CheckoutOrderRequest) {
    return this.orderService.checkout(payload);
  }

  @MessagePattern('orders.list')
  list(@Payload() query: ListOrdersQuery) {
    return this.orderService.list(query);
  }

  @MessagePattern('orders.findOne')
  findOne(@Payload() data: { orderId: string }) {
    return this.orderService.findOne(data.orderId);
  }

  @MessagePattern('orders.summary')
  summary(@Payload() data: { orderId: string }) {
    return this.orderService.summary(data.orderId);
  }

  @MessagePattern('orders.updatePassengers')
  updatePassengers(
    @Payload()
    data: {
      orderId: string;
      payload: UpdateOrderPassengersRequest;
    },
  ) {
    return this.orderService.updatePassengers(data.orderId, data.payload);
  }

  @MessagePattern('orders.updateSeatLabels')
  updateSeatLabels(
    @Payload()
    data: {
      orderId: string;
      payload: UpdateOrderSeatLabelsRequest;
    },
  ) {
    return this.orderService.updateSeatLabels(data.orderId, data.payload);
  }

  @MessagePattern('orders.markPendingPayment')
  markPendingPayment(@Payload() data: { orderId: string }) {
    return this.orderService.markPendingPayment(data.orderId);
  }

  @MessagePattern('orders.markPaid')
  markPaid(@Payload() data: { orderId: string }) {
    return this.orderService.markPaid(data.orderId);
  }

  @EventPattern('payment.paid')
  handlePaymentPaid(@Payload() payload: PaymentPaidEventPayload) {
    return this.orderService.handlePaymentPaidEvent(payload);
  }

  @EventPattern('orders.expire_check')
  handleOrderExpireCheck(@Payload() data: { orderId: string }) {
    return this.orderService.handleOrderExpireCheck(data);
  }

  @MessagePattern('orders.confirm')
  confirm(@Payload() data: { orderId: string }) {
    return this.orderService.confirm(data.orderId);
  }

  @MessagePattern('orders.issueTicket')
  issueTicket(@Payload() data: { orderId: string }) {
    return this.orderService.issueTicket(data.orderId);
  }

  @MessagePattern('orders.cancel')
  cancel(@Payload() data: { orderId: string; payload?: CancelOrderRequest }) {
    return this.orderService.cancel(data.orderId, data.payload);
  }

  @MessagePattern('orders.cancelWorkflow')
  cancelWorkflow(
    @Payload() data: { orderId: string; payload?: CancelOrderRequest },
  ) {
    return this.orderService.cancelWorkflow(data);
  }

  @MessagePattern('orders.expire')
  expire(@Payload() data: { orderId: string }): Promise<OrderResponse> {
    return this.orderService.expire(data.orderId);
  }

  @MessagePattern('orders.refund')
  refund(@Payload() data: { orderId: string }): Promise<OrderResponse> {
    return this.orderService.refund(data.orderId);
  }

  @MessagePattern('orders.remove')
  remove(@Payload() data: { orderId: string }) {
    return this.orderService.remove(data.orderId);
  }
}
