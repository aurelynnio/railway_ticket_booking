import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
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

/**
 * Các cột id/orderId/userId/transactionId trong PostgreSQL đều là kiểu UUID.
 * Nếu không chặn ở tầng DTO, giá trị sai định dạng sẽ đi xuống Prisma/Postgres
 * và gây lỗi bind, bị bọc thành HTTP 500 thay vì 400.
 *
 * Riêng transactionId còn phải nhận dạng 32 ký tự không gạch nối vì VNPay giới
 * hạn vnp_TxnRef 32 ký tự.
 */
const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Chuẩn hoá dạng 32 ký tự hex về UUID có gạch nối trước khi lưu/truy vấn. */
const normalizeUuid = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.length === 32 && !value.includes('-')
    ? `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
    : value;

/** Kiểm tra một trường là UUID hợp lệ (kèm chuẩn hoá dạng 32 ký tự của VNPay). */
const IsUuidLike = (field: string) =>
  applyDecorators(
    Transform(normalizeUuid),
    Matches(UUID_LIKE_PATTERN, { message: `${field} must be a valid UUID` }),
  );

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
  @Matches(/^\d+$/)
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
  @IsUuidLike('userId')
  @IsNotEmpty()
  userId?: string;

  @IsOptional()
  @IsUuidLike('orderId')
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

