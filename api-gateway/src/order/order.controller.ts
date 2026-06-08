import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CancelOrderRequest,
  CreateOrderRequest,
  ListOrdersQuery,
  UpdateOrderPassengersRequest,
  UpdateOrderSeatLabelsRequest,
} from './order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('health')
  health() {
    return this.orderService.health();
  }

  @Post()
  create(@Body() payload: CreateOrderRequest) {
    return this.orderService.create(payload);
  }

  @Get()
  list(@Query() query: ListOrdersQuery) {
    return this.orderService.list(query);
  }

  @Get(':orderId')
  findOne(@Param('orderId') orderId: string) {
    return this.orderService.findOne({ orderId });
  }

  @Get(':orderId/summary')
  summary(@Param('orderId') orderId: string) {
    return this.orderService.summary({ orderId });
  }

  @Patch(':orderId/passengers')
  updatePassengers(
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderPassengersRequest,
  ) {
    return this.orderService.updatePassengers({ orderId, payload });
  }

  @Patch(':orderId/seat-labels')
  updateSeatLabels(
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderSeatLabelsRequest,
  ) {
    return this.orderService.updateSeatLabels({ orderId, payload });
  }

  @Post(':orderId/mark-pending-payment')
  markPendingPayment(@Param('orderId') orderId: string) {
    return this.orderService.markPendingPayment({ orderId });
  }

  @Post(':orderId/mark-paid')
  markPaid(@Param('orderId') orderId: string) {
    return this.orderService.markPaid({ orderId });
  }

  @Post(':orderId/confirm')
  confirm(@Param('orderId') orderId: string) {
    return this.orderService.confirm({ orderId });
  }

  @Post(':orderId/issue-ticket')
  issueTicket(@Param('orderId') orderId: string) {
    return this.orderService.issueTicket({ orderId });
  }

  @Post(':orderId/cancel')
  cancel(
    @Param('orderId') orderId: string,
    @Body() payload?: CancelOrderRequest,
  ) {
    return this.orderService.cancel({ orderId, payload });
  }

  @Post(':orderId/expire')
  expire(@Param('orderId') orderId: string) {
    return this.orderService.expire({ orderId });
  }

  @Post(':orderId/refund')
  refund(@Param('orderId') orderId: string) {
    return this.orderService.refund({ orderId });
  }

  @Delete(':orderId')
  remove(@Param('orderId') orderId: string) {
    return this.orderService.remove({ orderId });
  }
}
