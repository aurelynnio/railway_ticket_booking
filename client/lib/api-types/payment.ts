import type { PaginatedResponse } from "./common";

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

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface CreatePaymentRequest {
  orderId: string;
  userId?: string | null;
  amount: string;
  paymentMethod: string;
}

export interface GetPaymentByIdRequest {
  id: string;
}

export interface GetPaymentByTransactionIdRequest {
  transactionId: string;
}

export interface ListPaymentsByOrderIdRequest {
  orderId: string;
}

export interface ListPaymentsByUserIdRequest extends PaginationQuery {
  userId: string;
}

export interface ListPaymentsQuery extends PaginationQuery {
  userId?: string;
  orderId?: string;
  status?: number | string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface PaymentLookupRequest {
  id?: string;
  transactionId?: string;
}

export type MarkProcessingRequest = PaymentLookupRequest;

export interface MarkPaidRequest extends PaymentLookupRequest {
  paidAt?: string;
}

export type MarkFailedRequest = PaymentLookupRequest;

export type CancelPaymentRequest = PaymentLookupRequest;

export type ExpirePaymentRequest = PaymentLookupRequest;

export interface SoftDeletePaymentRequest {
  id: string;
}

export type PaginatedPaymentsResponse = PaginatedResponse<PaymentDto>;

export interface PaymentMarkedPaidResponse {
  payment: PaymentDto;
  event: {
    name: "payment.paid";
    orderId: string;
    emittedAt: string;
  };
}
