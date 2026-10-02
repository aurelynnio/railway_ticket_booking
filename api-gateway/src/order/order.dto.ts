import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsUuidLike } from '../common/validators/uuid-like.validator';

/**
 * Upper bound for a single booking. Without a cap, `quantity` accepted any
 * positive integer, and the value flows into price arithmetic and inventory
 * calls.
 */
export const MAX_ORDER_QUANTITY = 20;

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

/** Accepted fare classes — mirrors orders-service. */
export enum PassengerType {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  STUDENT = 'STUDENT',
  SENIOR = 'SENIOR',
}

export const PASSENGER_TYPES: readonly string[] = Object.values(PassengerType);

export class OrderPassengerPayload {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(PASSENGER_TYPES, {
    message: `passengerType must be one of: ${PASSENGER_TYPES.join(', ')}`,
  })
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
  contactEmail: string | null;
  contactPhone: string | null;
  cancelReason: string | null;
  status: OrderStatus;
  seatLabels: string[];
  passengers: OrderPassenger[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type CancelledOrderResponse = OrderResponse;

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
  @IsOptional()
  @IsUuidLike('userId')
  @IsNotEmpty()
  userId: string;

  @IsUuidLike('ticketItemId')
  @IsNotEmpty()
  ticketItemId: string;

  @IsUuidLike('ticketId')
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
  @Max(MAX_ORDER_QUANTITY)
  quantity: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_ORDER_QUANTITY)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ORDER_QUANTITY)
  @ValidateNested({ each: true })
  @Type(() => OrderPassengerPayload)
  passengers?: OrderPassengerPayload[];

  /** Contact for e-ticket/order email delivery (falls back to account email). */
  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  contactPhone?: string | null;

  /** Unique per attempt; column is VarChar(64), so bound it before the DB does. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  voucherCode?: string | null;
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
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUuidLike('userId')
  @IsNotEmpty()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number | string;

  @IsOptional()
  @IsUuidLike('ticketId')
  @IsNotEmpty()
  ticketId?: string;

  @IsOptional()
  @IsUuidLike('ticketItemId')
  @IsNotEmpty()
  ticketItemId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ticketCode?: string;
}

export class UpdateOrderPassengersRequest {
  @IsArray()
  @ArrayMaxSize(MAX_ORDER_QUANTITY)
  @ValidateNested({ each: true })
  @Type(() => OrderPassengerPayload)
  passengers: OrderPassengerPayload[];
}

export class UpdateOrderSeatLabelsRequest {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_ORDER_QUANTITY)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  seatLabels: string[];
}

export class CancelOrderRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
