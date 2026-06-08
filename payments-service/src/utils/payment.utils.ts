import { HttpException, HttpStatus } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import type { PaymentDto, PaymentLookupRequest } from '../payment.dto';
import { PaymentStatus } from '../payment.dto';

export function requireObjectPayload<T>(
  value: T | null | undefined,
  fieldName: string,
): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpException(
      `${fieldName} must be a valid object`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return value;
}

export function normalizePositiveInteger(
  value: number | string | undefined,
  fallback: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function requireNonEmptyString(value: string, fieldName: string) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new HttpException(
      `${fieldName} is required`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return normalized;
}

export function requirePaymentLookup(lookup: PaymentLookupRequest) {
  requireObjectPayload(lookup, 'lookup');
  const id = lookup.id?.trim();
  const transactionId = lookup.transactionId?.trim();

  if (!id && !transactionId) {
    throw new HttpException(
      'id or transactionId is required',
      HttpStatus.BAD_REQUEST,
    );
  }

  return {
    ...(id ? { id } : {}),
    ...(transactionId ? { transactionId } : {}),
  };
}

export function parseAmount(value: string): bigint {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpException('amount is required', HttpStatus.BAD_REQUEST);
  }

  try {
    return BigInt(value.trim());
  } catch {
    throw new HttpException(
      'amount must be a valid integer string',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function parseDate(value: string | Date, fieldName: string): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new HttpException(
      `${fieldName} must be a valid date`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return date;
}

function ensureNullableDate(value: unknown, fieldName: string) {
  if (value === null || value === undefined) {
    return;
  }

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new HttpException(
      `${fieldName} must be a valid date`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export function requirePaymentRecord(
  payment: Payment | null | undefined,
  fieldName = 'payment',
): Payment {
  if (!payment) {
    throw new HttpException(
      `${fieldName} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  if (typeof payment.id !== 'string' || !payment.id.trim()) {
    throw new HttpException(
      `${fieldName}.id is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (typeof payment.orderId !== 'string' || !payment.orderId.trim()) {
    throw new HttpException(
      `${fieldName}.orderId is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (payment.userId !== null && payment.userId !== undefined) {
    requireNonEmptyString(payment.userId, `${fieldName}.userId`);
  }

  if (typeof payment.paymentMethod !== 'string' || !payment.paymentMethod.trim()) {
    throw new HttpException(
      `${fieldName}.paymentMethod is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (typeof payment.transactionId !== 'string' || !payment.transactionId.trim()) {
    throw new HttpException(
      `${fieldName}.transactionId is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (typeof payment.status !== 'number' || !(payment.status in PaymentStatus)) {
    throw new HttpException(
      `${fieldName}.status is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (typeof payment.amount !== 'bigint') {
    throw new HttpException(
      `${fieldName}.amount is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  ensureNullableDate(payment.paidAt, `${fieldName}.paidAt`);
  ensureNullableDate(payment.deletedAt, `${fieldName}.deletedAt`);

  if (
    !(payment.createdAt instanceof Date) ||
    Number.isNaN(payment.createdAt.getTime())
  ) {
    throw new HttpException(
      `${fieldName}.createdAt is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  if (
    !(payment.updatedAt instanceof Date) ||
    Number.isNaN(payment.updatedAt.getTime())
  ) {
    throw new HttpException(
      `${fieldName}.updatedAt is invalid`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  return payment;
}

export function toPaymentDto(payment: Payment): PaymentDto {
  const safePayment = requirePaymentRecord(payment);

  return {
    id: safePayment.id,
    orderId: safePayment.orderId,
    userId: safePayment.userId,
    amount: safePayment.amount.toString(),
    paymentMethod: safePayment.paymentMethod,
    status: safePayment.status as PaymentStatus,
    transactionId: safePayment.transactionId,
    paidAt: safePayment.paidAt?.toISOString() ?? null,
    createdAt: safePayment.createdAt.toISOString(),
    updatedAt: safePayment.updatedAt.toISOString(),
    deletedAt: safePayment.deletedAt?.toISOString() ?? null,
  };
}
