import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import type { PaymentPaidEventPayload } from './orders.contracts';
import {
  CancelOrderRequest,
  CheckoutOrderRequest,
  CreateOrderRequest,
  ListOrdersQuery,
  OrderResponse,
  UpdateOrderPassengersRequest,
  UpdateOrderSeatLabelsRequest,
} from './orders.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('orders.health')
  health() {
    return this.ordersService.health();
  }

  @MessagePattern('orders.create')
  create(@Payload() payload: CreateOrderRequest) {
    return this.ordersService.create(payload);
  }

  @MessagePattern('orders.checkout')
  checkout(@Payload() payload: CheckoutOrderRequest) {
    return this.ordersService.checkout(payload);
  }

  @MessagePattern('orders.list')
  list(@Payload() query: ListOrdersQuery) {
    return this.ordersService.list(query);
  }

  @MessagePattern('orders.findOne')
  findOne(@Payload() data: { orderId: string }) {
    return this.ordersService.findOne(data.orderId);
  }

  @MessagePattern('orders.summary')
  summary(@Payload() data: { orderId: string }) {
    return this.ordersService.summary(data.orderId);
  }

  @MessagePattern('orders.updatePassengers')
  updatePassengers(
    @Payload()
    data: {
      orderId: string;
      payload: UpdateOrderPassengersRequest;
    },
  ) {
    return this.ordersService.updatePassengers(data.orderId, data.payload);
  }

  @MessagePattern('orders.updateSeatLabels')
  updateSeatLabels(
    @Payload()
    data: {
      orderId: string;
      payload: UpdateOrderSeatLabelsRequest;
    },
  ) {
    return this.ordersService.updateSeatLabels(data.orderId, data.payload);
  }

  @MessagePattern('orders.markPendingPayment')
  markPendingPayment(@Payload() data: { orderId: string }) {
    return this.ordersService.markPendingPayment(data.orderId);
  }

  @MessagePattern('orders.markPaid')
  markPaid(@Payload() data: { orderId: string }) {
    return this.ordersService.markPaid(data.orderId);
  }

  @EventPattern('payment.paid')
  handlePaymentPaid(@Payload() payload: PaymentPaidEventPayload) {
    return this.ordersService.handlePaymentPaidEvent(payload);
  }

  @EventPattern('orders.expire_check')
  handleOrderExpireCheck(@Payload() data: { orderId: string }) {
    return this.ordersService.handleOrderExpireCheck(data);
  }

  @MessagePattern('orders.confirm')
  confirm(@Payload() data: { orderId: string }) {
    return this.ordersService.confirm(data.orderId);
  }

  @MessagePattern('orders.issueTicket')
  issueTicket(@Payload() data: { orderId: string }) {
    return this.ordersService.issueTicket(data.orderId);
  }

  @MessagePattern('orders.cancel')
  cancel(@Payload() data: { orderId: string; payload?: CancelOrderRequest }) {
    return this.ordersService.cancel(data.orderId, data.payload);
  }

  @MessagePattern('orders.cancelWorkflow')
  cancelWorkflow(
    @Payload() data: { orderId: string; payload?: CancelOrderRequest },
  ) {
    return this.ordersService.cancelWorkflow(data);
  }

  @MessagePattern('orders.expire')
  expire(@Payload() data: { orderId: string }): Promise<OrderResponse> {
    return this.ordersService.expire(data.orderId);
  }

  @MessagePattern('orders.refund')
  refund(@Payload() data: { orderId: string }): Promise<OrderResponse> {
    return this.ordersService.refund(data.orderId);
  }

  @MessagePattern('orders.remove')
  remove(@Payload() data: { orderId: string }) {
    return this.ordersService.remove(data.orderId);
  }
}
