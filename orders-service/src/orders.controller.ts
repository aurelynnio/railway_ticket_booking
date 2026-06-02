import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { CreateOrderRequest } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('health')
  health() {
    return this.ordersService.health();
  }

  @Post()
  create(@Body() payload: CreateOrderRequest) {
    return this.ordersService.create(payload);
  }

  @Get()
  list() {
    return this.ordersService.list();
  }
}
