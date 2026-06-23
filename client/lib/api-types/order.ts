export enum OrderStatus {
  Draft = 0,
  PendingPayment = 1,
  Paid = 2,
  Confirmed = 3,
  TicketIssued = 4,
  Cancelled = 5,
  Expired = 6,
  Refunded = 7,
}

export interface OrderPassenger {
  fullName: string;
  passengerType: string;
  identityNumber: string | null;
  phoneNumber: string | null;
}

export interface OrderResponse {
  id: string;
  userId: string;
  ticketItemId: string;
  ticketId: string;
  ticketTitle: string;
  trainNumber: string | null;
  departureStationCode: string | null;
  departureStationName: string | null;
  arrivalStationCode: string | null;
  arrivalStationName: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  coachCode: string | null;
  seatClass: string | null;
  seatType: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  ticketCode: string | null;
  qrPayload: string | null;
  status: OrderStatus;
  seatLabels: string[];
  passengers: OrderPassenger[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  cancelReason?: string | null;
}

export interface OrderSummaryResponse {
  orderId: string;
  userId: string;
  ticketId: string;
  ticketItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  seatCount: number;
  passengerCount: number;
  status: OrderStatus;
  ticketIssued: boolean;
}

export interface OrderCheckoutResponse {
  order: OrderResponse;
  payment: import("./payment").PaymentDto;
  reservation: {
    ticketId: string;
    ticketItemId: string;
    reservedSeatLabels: string[];
    reservedQuantity: number;
  };
}

export interface CancelOrderWorkflowResponse {
  order: OrderResponse;
  releasedSeatLabels: string[];
  releasedQuantity: number;
  cancelledPaymentIds: string[];
  warnings: string[];
}

export interface UpdateOrderPassengersRequest {
  passengers: OrderPassenger[];
}

export interface UpdateOrderSeatLabelsRequest {
  seatLabels: string[];
}
