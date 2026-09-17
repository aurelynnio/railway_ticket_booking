import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsUuidLike } from '../common/validators/uuid-like.validator';

export enum PaymentStatus {
  Pending = 0,
  Processing = 1,
  Paid = 2,
  Failed = 3,
  Cancelled = 4,
  Expired = 5,
  Refunded = 6,
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
  @IsUuidLike('orderId')
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsUuidLike('userId')
  @IsNotEmpty()
  userId?: string | null;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsUuidLike('transactionId')
  @IsNotEmpty()
  transactionId?: string;
}

export class GetPaymentByIdRequest {
  @IsUuidLike('id')
  @IsNotEmpty()
  id: string;
}

export class GetPaymentByTransactionIdRequest {
  @IsUuidLike('transactionId')
  @IsNotEmpty()
  transactionId: string;
}

export class ListPaymentsByOrderIdRequest {
  @IsUuidLike('orderId')
  @IsNotEmpty()
  orderId: string;
}

export class ListPaymentsByUserIdRequest {
  @IsUuidLike('userId')
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationQuery)
  pagination?: PaginationQuery;
}

export class ListPaymentsQuery {
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
  @IsUuidLike('userId')
  @IsNotEmpty()
  userId?: string;

  @IsOptional()
  @IsUuidLike('orderId')
  @IsNotEmpty()
  orderId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number | string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  paymentMethod?: string;

  @IsOptional()
  @IsUuidLike('transactionId')
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
  @IsUuidLike('id')
  @IsNotEmpty()
  id?: string;

  @ValidateIf((o: PaymentLookupRequest) => !o.id)
  @IsUuidLike('transactionId')
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

export class MarkRefundedRequest extends PaymentLookupRequest {}

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

export interface PaymentMarkedPaidResponse {
  payment: PaymentDto;
  event: {
    name: 'payment.paid';
    orderId: string;
    emittedAt: string;
  };
}
