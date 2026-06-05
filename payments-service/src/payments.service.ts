import { Injectable } from '@nestjs/common';

export enum PaymentStatus {
  Pending = 0,
  Processing = 1,
  Paid = 2,
  Failed = 3,
  Cancelled = 4,
  Expired = 5,
}

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
      status: PaymentStatus.Pending,
    };
  }

  status(orderId: string) {
    return {
      orderId,
      status: PaymentStatus.Pending,
    };
  }
}
