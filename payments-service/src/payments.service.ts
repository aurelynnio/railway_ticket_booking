import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Prisma, PrismaClient, type Payment } from '@prisma/client';
import type {
  CreatePaymentRequest,
  ListPaymentsQuery,
  MarkPaidRequest,
  PaymentDto,
  PaymentLookupRequest,
  PaymentMarkedPaidResponse,
  PaymentPaidEventPayload,
  PaginatedPaymentsResponse,
  PaginationQuery,
} from './payment.dto';
import { PaymentStatus } from './payment.dto';
import {
  parseAmount,
  toPaymentDto,
} from './utils/payment.utils';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject('order_service') private readonly orderClient: ClientProxy,
  ) {}

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
    const orderId = payload.orderId.trim();
    const paymentMethod = payload.paymentMethod.trim();
    const transactionId = payload.transactionId?.trim() || randomUUID();

    const amount = parseAmount(payload.amount);

    const created = await this.prisma.payment.create({
      data: {
        orderId,
        userId: payload.userId?.trim() || null,
        amount,
        paymentMethod,
        status: PaymentStatus.Pending,
        transactionId,
      },
    });

    return toPaymentDto(created);
  }

  async getPaymentById(paymentId: string): Promise<PaymentDto> {
    const payment = await this.getPaymentOrThrow({ id: paymentId.trim() });
    return toPaymentDto(payment);
  }

  async getPaymentByTransactionId(transactionId: string): Promise<PaymentDto> {
    const payment = await this.getPaymentOrThrow({
      transactionId: transactionId.trim(),
    });
    return toPaymentDto(payment);
  }

  async listPaymentsByOrderId(orderId: string): Promise<PaymentDto[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        orderId: orderId.trim(),
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map(toPaymentDto);
  }

  async listPaymentsByUserId(
    userId: string,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedPaymentsResponse> {
    return this.listPayments(pagination, { userId: userId.trim() });
  }

  /*
   * Build one Prisma filter object from optional query fields before running
   * the count and page query together to keep pagination metadata consistent.
   */
  async listPayments(
    pagination: PaginationQuery = {},
    query: ListPaymentsQuery = {},
  ): Promise<PaginatedPaymentsResponse> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
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

    if (query.status !== undefined) {
      where.status = Number(query.status);
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
    return this.updatePaymentStatus(lookup, PaymentStatus.Processing);
  }

  /*
   * Marking a payment as paid is stricter than other status changes because
   * it also records the settlement time and rejects duplicate confirmation.
   */
  async markPaid(payload: MarkPaidRequest): Promise<PaymentDto> {
    const paidAt = payload.paidAt ?? new Date();

    const payment = await this.getPaymentOrThrow(payload);

    if (payment.status === Number(PaymentStatus.Paid)) {
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

  async markPaidWorkflow(
    payload: MarkPaidRequest,
  ): Promise<PaymentMarkedPaidResponse> {
    const payment = await this.markPaid(payload);
    const emittedAt = new Date().toISOString();
    await this.emitPaymentPaidEvent({
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
    });

    return {
      payment,
      event: {
        name: 'payment.paid',
        orderId: payment.orderId,
        emittedAt,
      },
    };
  }

  async markFailed(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Failed);
  }

  async cancelPayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Cancelled);
  }

  async expirePayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Expired);
  }

  async softDeletePayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    const payment = await this.getPaymentOrThrow(lookup);
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

    if (!payment) {
      throw new HttpException('payment not found', HttpStatus.NOT_FOUND);
    }

    return payment;
  }

  private buildPaymentLookupWhere(
    lookup: PaymentLookupRequest,
  ): Prisma.PaymentWhereInput {
    const id = lookup.id?.trim();
    const transactionId = lookup.transactionId?.trim();

    if (!id && !transactionId) {
      throw new HttpException(
        'id or transactionId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      deletedAt: null,
      ...(id ? { id } : {}),
      ...(transactionId ? { transactionId } : {}),
    };
  }

  private async emitPaymentPaidEvent(
    payload: PaymentPaidEventPayload,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.orderClient.emit('payment.paid', payload).subscribe({
        next: () => resolve(),
        error: reject,
        complete: () => resolve(),
      });
    });
  }
}
