import { Injectable } from '@nestjs/common';

export interface ReserveTicketRequest {
  tripId: string;
  seatCode: string;
  passengerId: string;
}

@Injectable()
export class TicketsService {
  health() {
    return {
      service: 'tickets-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  availability() {
    return [
      {
        tripId: 'trip_mock_1',
        seatCode: 'A01',
        coach: '1',
        price: 450000,
        status: 'available',
      },
    ];
  }

  reserve(payload: ReserveTicketRequest) {
    return {
      reservationId: 'reservation_mock_1',
      ...payload,
      status: 'reserved',
    };
  }
}
