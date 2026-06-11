import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, type Payment } from '@prisma/client';
import type {
  CreatePaymentRequest,
  ListPaymentsQuery,
  MarkPaidRequest,
  PaymentDto,
  PaymentLookupRequest,
  PaginatedPaymentsResponse,
  PaginationQuery,
} from './payment.dto';
import { PaymentStatus } from './payment.dto';
import {
  normalizePositiveInteger,
  parseAmount,
  parseDate,
  requireNonEmptyString,
  requireObjectPayload,
  requirePaymentRecord,
  requirePaymentLookup,
  toPaymentDto,
} from './utils/payment.utils';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaClient) {}

  health() {
    return {
      service: 'payments-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /*
   * Validate the write payload at the edge, then create a pending payment
   * with a generated transaction id so provider reconciliation can happen later.
   */
  async createPayment(payload: CreatePaymentRequest): Promise<PaymentDto> {
    requireObjectPayload(payload, 'payload');
    const orderId = requireNonEmptyString(payload.orderId, 'orderId');
    const paymentMethod = requireNonEmptyString(
      payload.paymentMethod,
      'paymentMethod',
    );

    const amount = parseAmount(payload.amount);

    const created = await this.prisma.payment.create({
      data: {
        orderId,
        userId: payload.userId?.trim() || null,
        amount,
        paymentMethod,
        status: PaymentStatus.Pending,
        transactionId: randomUUID(),
      },
    });

    return toPaymentDto(created);
  }

  async getPaymentById(paymentId: string): Promise<PaymentDto> {
    const id = requireNonEmptyString(paymentId, 'id');
    const payment = await this.getPaymentOrThrow({ id });
    return toPaymentDto(payment);
  }

  async getPaymentByTransactionId(transactionId: string): Promise<PaymentDto> {
    const normalizedTransactionId = requireNonEmptyString(
      transactionId,
      'transactionId',
    );
    const payment = await this.getPaymentOrThrow({
      transactionId: normalizedTransactionId,
    });
    return toPaymentDto(payment);
  }

  async listPaymentsByOrderId(orderId: string): Promise<PaymentDto[]> {
    const normalizedOrderId = requireNonEmptyString(orderId, 'orderId');

    const payments = await this.prisma.payment.findMany({
      where: {
        orderId: normalizedOrderId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (payments.length === 0) {
      throw new HttpException(
        'No payments found for the given orderId',
        HttpStatus.NOT_FOUND,
      );
    }

    return payments.map(toPaymentDto);
  }

  async listPaymentsByUserId(
    userId: string,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedPaymentsResponse> {
    const normalizedUserId = requireNonEmptyString(userId, 'userId');
    requireObjectPayload(pagination, 'pagination');

    return this.listPayments(pagination, { userId: normalizedUserId });
  }

  /*
   * Build one Prisma filter object from optional query fields before running
   * the count and page query together to keep pagination metadata consistent.
   */
  async listPayments(
    pagination: PaginationQuery = {},
    query: ListPaymentsQuery = {},
  ): Promise<PaginatedPaymentsResponse> {
    requireObjectPayload(pagination, 'pagination');
    requireObjectPayload(query, 'query');
    const page = normalizePositiveInteger(pagination.page, 1);
    const limit = normalizePositiveInteger(pagination.limit, 10);
    const where: Prisma.PaymentWhereInput = {
      deletedAt: null,
    };

    if (query.userId?.trim()) {
      where.userId = query.userId.trim();
    }

    if (query.orderId?.trim()) {
      where.orderId = query.orderId.trim();
    }

    if (query.paymentMethod?.trim()) {
      where.paymentMethod = query.paymentMethod.trim();
    }

    if (query.transactionId?.trim()) {
      where.transactionId = query.transactionId.trim();
    }

    if (query.status !== undefined && query.status !== '') {
      const status = Number(query.status);
      if (!Number.isInteger(status)) {
        throw new HttpException(
          'status must be an integer',
          HttpStatus.BAD_REQUEST,
        );
      }
      where.status = status;
    }

    const [total, payments] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: payments.map(toPaymentDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async markProcessing(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(
      requirePaymentLookup(lookup),
      PaymentStatus.Processing,
    );
  }

  /*
   * Marking a payment as paid is stricter than other status changes because
   * it also records the settlement time and rejects duplicate confirmation.
   */
  async markPaid(payload: MarkPaidRequest): Promise<PaymentDto> {
    requireObjectPayload(payload, 'payload');
    const lookup = requirePaymentLookup(payload);
    const paidAt = payload.paidAt
      ? parseDate(payload.paidAt, 'paidAt')
      : new Date();

    const payment = await this.getPaymentOrThrow(lookup);

    if (payment.status === PaymentStatus.Paid) {
      throw new HttpException(
        'Payment is already marked as paid',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.Paid,
        paidAt,
      },
    });

    return toPaymentDto(updated);
  }

  async markFailed(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(
      requirePaymentLookup(lookup),
      PaymentStatus.Failed,
    );
  }

  async cancelPayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(
      requirePaymentLookup(lookup),
      PaymentStatus.Cancelled,
    );
  }

  async expirePayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(
      requirePaymentLookup(lookup),
      PaymentStatus.Expired,
    );
  }

  async softDeletePayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    const payment = await this.getPaymentOrThrow(requirePaymentLookup(lookup));
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        deletedAt: new Date(),
      },
    });

    return toPaymentDto(updated);
  }

  private async updatePaymentStatus(
    lookup: PaymentLookupRequest,
    status: PaymentStatus,
  ): Promise<PaymentDto> {
    /*
     * Centralize simple status writes so non-paid transitions reuse the same
     * lookup and persistence path instead of duplicating update code.
     */
    const payment = await this.getPaymentOrThrow(lookup);
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    return toPaymentDto(updated);
  }

  private async getPaymentOrThrow(
    lookup: PaymentLookupRequest,
  ): Promise<Payment> {
    const where = this.buildPaymentLookupWhere(lookup);
    const payment = await this.prisma.payment.findFirst({ where });
    return requirePaymentRecord(payment);
  }

  private buildPaymentLookupWhere(
    lookup: PaymentLookupRequest,
  ): Prisma.PaymentWhereInput {
    const normalizedLookup = requirePaymentLookup(lookup);

    return {
      deletedAt: null,
      ...normalizedLookup,
    };
  }
}
