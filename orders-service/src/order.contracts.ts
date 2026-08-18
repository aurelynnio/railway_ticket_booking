export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface PaymentDto {
  id: string;
  orderId: string;
  userId: string | null;
  amount: string;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TicketSnapshot {
  id: string;
  title: string | null;
  trainNumber: string | null;
  departureStationCode: string | null;
  departureStationName: string | null;
  arrivalStationCode: string | null;
  arrivalStationName: string | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export interface TicketItemSnapshot {
  id: string;
  coachCode: string | null;
  seatClass: string | null;
  seatType: string | null;
  priceOriginal: number | null;
  priceFlash: number | null;
}

export interface PaymentPaidEventPayload {
  paymentId?: string;
  orderId: string;
  userId?: string | null;
  transactionId?: string;
  paidAt?: string | null;
}
