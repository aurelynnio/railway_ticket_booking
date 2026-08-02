import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export enum PaymentStatus {
  Pending = 0,
  Processing = 1,
  Paid = 2,
  Failed = 3,
  Cancelled = 4,
  Expired = 5,
}

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

export class PaginationQuery {
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
}

export class CreatePaymentRequest {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string | null;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  amount: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  transactionId?: string;
}

export class GetPaymentByIdRequest {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class GetPaymentByTransactionIdRequest {
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}

export class ListPaymentsByOrderIdRequest {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class ListPaymentsByUserIdRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationQuery)
  pagination?: PaginationQuery;
}

export class ListPaymentsQuery {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orderId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  transactionId?: string;
}

export class ListPaymentsRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationQuery)
  pagination?: PaginationQuery;

  @IsOptional()
  @ValidateNested()
  @Type(() => ListPaymentsQuery)
  query?: ListPaymentsQuery;
}

export class PaymentLookupRequest {
  @ValidateIf((o: PaymentLookupRequest) => !o.transactionId)
  @IsString()
  @IsNotEmpty()
  id?: string;

  @ValidateIf((o: PaymentLookupRequest) => !o.id)
  @IsString()
  @IsNotEmpty()
  transactionId?: string;
}

export class MarkProcessingRequest extends PaymentLookupRequest {}

export class MarkPaidRequest extends PaymentLookupRequest {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;
}

export class MarkFailedRequest extends PaymentLookupRequest {}

export class CancelPaymentRequest extends PaymentLookupRequest {}

export class ExpirePaymentRequest extends PaymentLookupRequest {}

export class SoftDeletePaymentRequest extends PaymentLookupRequest {}

export interface PaginatedPaymentsResponse {
  data: PaymentDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

export interface PaymentPaidEventPayload {
  paymentId: string;
  orderId: string;
  userId: string | null;
  transactionId: string;
  paidAt: string | null;
}

export interface PaymentMarkedPaidResponse {
  payment: PaymentDto;
  event: {
    name: 'payment.paid';
    orderId: string;
    emittedAt: string;
  };
}
