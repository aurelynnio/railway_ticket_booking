import { Injectable } from '@nestjs/common';

export interface CreateOrderRequest {
  userId: string;
  ticketIds: string[];
}

@Injectable()
export class OrdersService {
  health() {
    return {
      service: 'orders-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  create(payload: CreateOrderRequest) {
    return {
      orderId: 'order_mock_1',
      ...payload,
      status: 'pending_payment',
    };
  }

  list() {
    return [
      {
        orderId: 'order_mock_1',
        userId: 'user_mock_1',
        status: 'pending_payment',
      },
    ];
  }
}
