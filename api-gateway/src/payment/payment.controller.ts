import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CancelPaymentRequest,
  CreatePaymentRequest,
  ExpirePaymentRequest,
  ListPaymentsQuery,
  MarkFailedRequest,
  MarkPaidRequest,
  MarkProcessingRequest,
  PaginationQuery,
} from './payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('health')
  health() {
    return this.paymentService.health();
  }

  @Post()
  createPayment(@Body() payload: CreatePaymentRequest) {
    return this.paymentService.createPayment(payload);
  }

  @Get()
  listPayments(
    @Query() query: ListPaymentsQuery,
    @Query() pagination: PaginationQuery,
  ) {
    return this.paymentService.listPayments({ query, pagination });
  }

  @Get('transaction/:transactionId')
  getPaymentByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentService.getPaymentByTransactionId({ transactionId });
  }

  @Get('order/:orderId')
  listPaymentsByOrderId(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentsByOrderId({ orderId });
  }

  @Get('user/:userId')
  listPaymentsByUserId(
    @Param('userId') userId: string,
    @Query() pagination: PaginationQuery,
  ) {
    return this.paymentService.getPaymentsByUserId({ userId, pagination });
  }

  @Get(':id')
  getPaymentById(@Param('id') id: string) {
    return this.paymentService.getPaymentById({ id });
  }

  @Post('mark-processing')
  markProcessing(@Body() payload: MarkProcessingRequest) {
    return this.paymentService.markProcessing(payload);
  }

  @Post('mark-paid')
  markPaid(@Body() payload: MarkPaidRequest) {
    return this.paymentService.markPaid(payload);
  }

  @Post('mark-failed')
  markFailed(@Body() payload: MarkFailedRequest) {
    return this.paymentService.markFailed(payload);
  }

  @Post('cancel')
  cancelPayment(@Body() payload: CancelPaymentRequest) {
    return this.paymentService.cancelPayment(payload);
  }

  @Post('expire')
  expirePayment(@Body() payload: ExpirePaymentRequest) {
    return this.paymentService.expirePayment(payload);
  }

  @Delete(':id')
  softDeletePayment(@Param('id') id: string) {
    return this.paymentService.softDeletePayment({ id });
  }
}
