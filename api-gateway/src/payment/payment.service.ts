import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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

@Injectable()
export class PaymentService {
  constructor(@Inject('payment_service') private readonly paymentClient: ClientProxy) {}

  health() {
    return this.paymentClient.send('payments.health', {});
  }

  createPayment(payload: CreatePaymentRequest) {
    return this.paymentClient.send('payments.create', payload);
  }

  getPaymentById(data: GetPaymentByIdRequest) {
    return this.paymentClient.send('payments.findOne', data);
  }

  getPaymentByTransactionId(data: GetPaymentByTransactionIdRequest) {
    return this.paymentClient.send('payments.findByTransactionId', data);
  }

  getPaymentsByOrderId(data: ListPaymentsByOrderIdRequest) {
    return this.paymentClient.send('payments.listByOrderId', data);
  }

  getPaymentsByUserId(data: ListPaymentsByUserIdRequest) {
    return this.paymentClient.send('payments.listByUserId', data);
  }

  listPayments(data: ListPaymentsRequest) {
    return this.paymentClient.send('payments.list', data);
  }

  markProcessing(payload: MarkProcessingRequest) {
    return this.paymentClient.send('payments.markProcessing', payload);
  }

  markPaid(payload: MarkPaidRequest) {
    return this.paymentClient.send('payments.markPaid', payload);
  }

  markPaidWorkflow(payload: MarkPaidRequest) {
    return this.paymentClient.send('payments.markPaidWorkflow', payload);
  }

  markFailed(payload: MarkFailedRequest) {
    return this.paymentClient.send('payments.markFailed', payload);
  }

  cancelPayment(payload: CancelPaymentRequest) {
    return this.paymentClient.send('payments.cancel', payload);
  }

  expirePayment(payload: ExpirePaymentRequest) {
    return this.paymentClient.send('payments.expire', payload);
  }

  softDeletePayment(payload: SoftDeletePaymentRequest) {
    return this.paymentClient.send('payments.remove', payload);
  }
}
