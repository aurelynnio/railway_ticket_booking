import { HttpException, HttpStatus } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import type { PaymentDto } from '../dto/payment.dto';

/** Longest accepted integer string for an amount (guards against huge payloads). */
const MAX_AMOUNT_DIGITS = 18;

export function parseAmount(value: string): bigint {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpException('amount is required', HttpStatus.BAD_REQUEST);
  }

  const normalized = value.trim();

  // Structural check first: BigInt() would happily accept "-5", "+5", "0x10"
  // and surrounding whitespace, none of which are valid money values.
  if (!/^\d+$/.test(normalized)) {
    throw new HttpException(
      'amount must be a valid non-negative integer string',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (normalized.length > MAX_AMOUNT_DIGITS) {
    throw new HttpException(
      `amount must not exceed ${MAX_AMOUNT_DIGITS} digits`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return BigInt(normalized);
}

export function toPaymentDto(payment: Payment): PaymentDto {
  return {
    id: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    amount: payment.amount.toString(),
    paymentMethod: payment.paymentMethod,
    status: payment.status,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    deletedAt: payment.deletedAt?.toISOString() ?? null,
  };
}
