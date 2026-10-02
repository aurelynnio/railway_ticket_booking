export type PaymentStatus = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Status values as sent by payments-service. Kept as a const map so this
 * service never compares a settlement against a bare magic number.
 */
export const PAYMENT_STATUS = {
  Pending: 0,
  Processing: 1,
  Paid: 2,
  Failed: 3,
  Cancelled: 4,
  Expired: 5,
} as const;

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
  priceOriginal: string | null;
  priceFlash: string | null;
}

export interface PaymentPaidEventPayload {
  paymentId?: string;
  orderId: string;
  userId?: string | null;
  transactionId?: string;
  paidAt?: string | null;
}

