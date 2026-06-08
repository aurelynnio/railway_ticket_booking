import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePaymentRequest } from './payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('health')
  health() {
    return this.paymentsService.health();
  }

  @Post()
  create(@Body() payload: CreatePaymentRequest) {
    return this.paymentsService.createPayment(payload);
  }

  @Get(':orderId')
  listByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.listPaymentsByOrderId(orderId);
  }
}
