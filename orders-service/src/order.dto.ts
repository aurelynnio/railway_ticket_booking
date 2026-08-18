import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

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

export class OrderPassengerPayload {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  passengerType: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  identityNumber?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string | null;
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
}

export interface CancelledOrderResponse extends OrderResponse {
  cancelReason: string | null;
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

export interface PaginatedOrdersResponse {
  data: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderCheckoutResponse {
  order: OrderResponse;
  payment: {
    id: string;
    orderId: string;
    userId: string | null;
    amount: string;
    paymentMethod: string;
    status: number;
    transactionId: string;
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  reservation: {
    ticketId: string;
    ticketItemId: string;
    reservedSeatLabels: string[];
    reservedQuantity: number;
  };
}

export interface CancelOrderWorkflowResponse {
  order: CancelledOrderResponse;
  releasedSeatLabels: string[];
  releasedQuantity: number;
  cancelledPaymentIds: string[];
  warnings: string[];
}

export class CreateOrderRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  ticketItemId: string;

  @IsString()
  @IsNotEmpty()
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  ticketTitle: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  trainNumber?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departureStationCode?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departureStationName?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  arrivalStationCode?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  arrivalStationName?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departureTime?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  arrivalTime?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  coachCode?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  seatClass?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  seatType?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPassengerPayload)
  passengers?: OrderPassengerPayload[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idempotencyKey?: string;
}

export class CheckoutOrderRequest extends CreateOrderRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  paymentMethod?: string;
}

export class ListOrdersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number | string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ticketId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ticketItemId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ticketCode?: string;
}

export class UpdateOrderPassengersRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPassengerPayload)
  passengers: OrderPassengerPayload[];
}

export class UpdateOrderSeatLabelsRequest {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  seatLabels: string[];
}

export class CancelOrderRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;
}
