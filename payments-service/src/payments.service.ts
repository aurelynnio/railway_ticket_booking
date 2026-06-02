import { Injectable } from '@nestjs/common';

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  provider: string;
}

@Injectable()
export class PaymentsService {
  health() {
    return {
      service: 'payments-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  create(payload: CreatePaymentRequest) {
    return {
      paymentId: 'payment_mock_1',
      ...payload,
      status: 'created',
    };
  }

  status(orderId: string) {
    return {
      orderId,
      status: 'created',
    };
  }
}
