import { HttpException, HttpStatus } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import type { PaymentDto } from '../payment.dto';

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
