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
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('payments.health')
  health() {
    return this.paymentsService.health();
  }

  @MessagePattern('payments.create')
  create(@Payload() payload: CreatePaymentRequest) {
    return this.paymentsService.createPayment(payload);
  }

  @MessagePattern('payments.findOne')
  getPaymentById(@Payload() payload: GetPaymentByIdRequest) {
    return this.paymentsService.getPaymentById(payload.id);
  }

  @MessagePattern('payments.findByTransactionId')
  getPaymentByTransactionId(
    @Payload() payload: GetPaymentByTransactionIdRequest,
  ) {
    return this.paymentsService.getPaymentByTransactionId(
      payload.transactionId,
    );
  }

  @MessagePattern('payments.listByOrderId')
  listByOrderId(@Payload() payload: ListPaymentsByOrderIdRequest) {
    return this.paymentsService.listPaymentsByOrderId(payload.orderId);
  }

  @MessagePattern('payments.listByUserId')
  listByUserId(@Payload() payload: ListPaymentsByUserIdRequest) {
    return this.paymentsService.listPaymentsByUserId(
      payload.userId,
      payload.pagination,
    );
  }

  @MessagePattern('payments.list')
  list(@Payload() payload: ListPaymentsRequest) {
    return this.paymentsService.listPayments(
      payload?.pagination,
      payload?.query,
    );
  }

  @MessagePattern('payments.markProcessing')
  markProcessing(@Payload() payload: MarkProcessingRequest) {
    return this.paymentsService.markProcessing(payload);
  }

  @MessagePattern('payments.markPaid')
  markPaid(@Payload() payload: MarkPaidRequest) {
    return this.paymentsService.markPaid(payload);
  }

  @MessagePattern('payments.markPaidWorkflow')
  markPaidWorkflow(@Payload() payload: MarkPaidRequest) {
    return this.paymentsService.markPaidWorkflow(payload);
  }

  @MessagePattern('payments.markFailed')
  markFailed(@Payload() payload: MarkFailedRequest) {
    return this.paymentsService.markFailed(payload);
  }

  @MessagePattern('payments.cancel')
  cancel(@Payload() payload: CancelPaymentRequest) {
    return this.paymentsService.cancelPayment(payload);
  }

  @MessagePattern('payments.expire')
  expire(@Payload() payload: ExpirePaymentRequest) {
    return this.paymentsService.expirePayment(payload);
  }

  @MessagePattern('payments.remove')
  remove(@Payload() payload: SoftDeletePaymentRequest) {
    return this.paymentsService.softDeletePayment(payload);
  }
}
