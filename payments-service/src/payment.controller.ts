import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CancelPaymentRequest,
  CreatePaymentRequest,
  ExpirePaymentRequest,
  GetPaymentByIdRequest,
  GetPaymentByTransactionIdRequest,
  ListPaymentsByOrderIdRequest,
  ListPaymentsByUserIdRequest,
  ListPaymentsRequest,
  MarkFailedRequest,
  MarkPaidRequest,
  MarkProcessingRequest,
  SoftDeletePaymentRequest,
} from './payment.dto';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('payments.health')
  health() {
    return this.paymentService.health();
  }

  @MessagePattern('payments.create')
  create(@Payload() payload: CreatePaymentRequest) {
    return this.paymentService.createPayment(payload);
  }

  @MessagePattern('payments.findOne')
  getPaymentById(@Payload() payload: GetPaymentByIdRequest) {
    return this.paymentService.getPaymentById(payload.id);
  }

  @MessagePattern('payments.findByTransactionId')
  getPaymentByTransactionId(
    @Payload() payload: GetPaymentByTransactionIdRequest,
  ) {
    return this.paymentService.getPaymentByTransactionId(
      payload.transactionId,
    );
  }

  @MessagePattern('payments.listByOrderId')
  listByOrderId(@Payload() payload: ListPaymentsByOrderIdRequest) {
    return this.paymentService.listPaymentsByOrderId(payload.orderId);
  }

  @MessagePattern('payments.listByUserId')
  listByUserId(@Payload() payload: ListPaymentsByUserIdRequest) {
    return this.paymentService.listPaymentsByUserId(
      payload.userId,
      payload.pagination,
    );
  }

  @MessagePattern('payments.list')
  list(@Payload() payload: ListPaymentsRequest) {
    return this.paymentService.listPayments(
      payload?.pagination,
      payload?.query,
    );
  }

  @MessagePattern('payments.markProcessing')
  markProcessing(@Payload() payload: MarkProcessingRequest) {
    return this.paymentService.markProcessing(payload);
  }

  @MessagePattern('payments.markPaid')
  markPaid(@Payload() payload: MarkPaidRequest) {
    return this.paymentService.markPaid(payload);
  }

  @MessagePattern('payments.markPaidWorkflow')
  markPaidWorkflow(@Payload() payload: MarkPaidRequest) {
    return this.paymentService.markPaidWorkflow(payload);
  }

  @MessagePattern('payments.markFailed')
  markFailed(@Payload() payload: MarkFailedRequest) {
    return this.paymentService.markFailed(payload);
  }

  @MessagePattern('payments.cancel')
  cancel(@Payload() payload: CancelPaymentRequest) {
    return this.paymentService.cancelPayment(payload);
  }

  @MessagePattern('payments.expire')
  expire(@Payload() payload: ExpirePaymentRequest) {
    return this.paymentService.expirePayment(payload);
  }

  @MessagePattern('payments.remove')
  remove(@Payload() payload: SoftDeletePaymentRequest) {
    return this.paymentService.softDeletePayment(payload);
  }
}
