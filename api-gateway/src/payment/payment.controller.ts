import { Controller, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentClient: ClientProxy,
    private readonly paymentService: PaymentService,
  ) {}

  async createPayment(payload: any) {}

  async getPaymentById(id: string) {}

  async listPayments(pagination: any) {}

  async listPaymentsByUserId(userId: string, pagination: any) {}

  async listPaymentsByOrderId(orderId: string, pagination: any) {}
}
