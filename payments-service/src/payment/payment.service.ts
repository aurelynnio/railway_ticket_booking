import { randomUUID } from 'crypto';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { and, asc, count, desc, eq, isNull, lte, type SQL } from 'drizzle-orm';
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
} from './dto/payment.dto';
import { PaymentStatus } from './dto/payment.dto';
import { parseAmount, toPaymentDto } from './utils/payment.utils';
import { DrizzleService } from '../drizzle/drizzle.service';
import { paymentOutbox, payments, type Payment } from '../drizzle/schema';

@Injectable()
export class PaymentService {
  private static readonly OUTBOX_BATCH_SIZE = 50;
  private static readonly OUTBOX_MAX_ATTEMPTS = 5;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly drizzle: DrizzleService,
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

    const [created] = await this.drizzle.db
      .insert(payments)
      .values({
        orderId,
        userId: payload.userId?.trim() || null,
        amount,
        paymentMethod,
        status: PaymentStatus.Pending,
        transactionId,
      })
      .returning();

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
    const rows = await this.drizzle.db.query.payments.findMany({
      where: and(
        eq(payments.orderId, orderId.trim()),
        isNull(payments.deletedAt),
      ),
      orderBy: [desc(payments.createdAt)],
    });

    return rows.map(toPaymentDto);
  }

  async listPaymentsByUserId(
    userId: string,
    pagination: PaginationQuery = {},
  ): Promise<PaginatedPaymentsResponse> {
    return this.listPayments(pagination, { userId: userId.trim() });
  }

  /*
   * Build one Drizzle filter condition from optional query fields before running
   * the count and page query together to keep pagination metadata consistent.
   */
  async listPayments(
    pagination: PaginationQuery = {},
    query: ListPaymentsQuery = {},
  ): Promise<PaginatedPaymentsResponse> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const conditions: SQL[] = [isNull(payments.deletedAt)];

    if (query.userId?.trim()) {
      conditions.push(eq(payments.userId, query.userId.trim()));
    }

    if (query.orderId?.trim()) {
      conditions.push(eq(payments.orderId, query.orderId.trim()));
    }

    if (query.paymentMethod?.trim()) {
      conditions.push(eq(payments.paymentMethod, query.paymentMethod.trim()));
    }

    if (query.transactionId?.trim()) {
      conditions.push(eq(payments.transactionId, query.transactionId.trim()));
    }

    if (query.status !== undefined) {
      conditions.push(eq(payments.status, Number(query.status)));
    }

    const whereClause = and(...conditions);

    const [total, rows] = await this.drizzle.db.transaction(async (tx) => {
      const [{ total: countValue }] = await tx
        .select({ total: count() })
        .from(payments)
        .where(whereClause);
      const found = await tx.query.payments.findMany({
        where: whereClause,
        orderBy: [desc(payments.createdAt)],
        offset: (page - 1) * limit,
        limit,
      });
      return [Number(countValue), found] as const;
    });

    return {
      data: rows.map(toPaymentDto),
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
    this.assertNotAlreadyPaid(payment);

    const [updated] = await this.drizzle.db
      .update(payments)
      .set({
        status: PaymentStatus.Paid,
        paidAt,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))
      .returning();

    return toPaymentDto(updated);
  }

  async markPaidWorkflow(
    payload: MarkPaidRequest,
  ): Promise<PaymentMarkedPaidResponse> {
    const existing = await this.getPaymentOrThrow(payload);
    this.assertNotAlreadyPaid(existing);

    const paidAt = payload.paidAt ?? new Date();

    // Transactional outbox: write the payment.paid event in the same DB
    // transaction that marks the payment as paid, so the event can never be
    // lost if the process crashes between commit and publish. A worker
    // (processOutbox) publishes due rows and marks them processed.
    const paidPayment = await this.drizzle.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(payments)
        .set({ status: PaymentStatus.Paid, paidAt, updatedAt: new Date() })
        .where(eq(payments.id, existing.id))
        .returning();

      await tx.insert(paymentOutbox).values({
        paymentId: updated.id,
        orderId: updated.orderId,
        userId: updated.userId,
        transactionId: updated.transactionId,
        paidAt: updated.paidAt ?? paidAt,
      });

      return updated;
    });

    const emittedAt = new Date().toISOString();

    return {
      payment: toPaymentDto(paidPayment),
      event: {
        name: 'payment.paid',
        orderId: paidPayment.orderId,
        emittedAt,
      },
    };
  }

  /** A settled payment must never be settled a second time. */
  private assertNotAlreadyPaid(payment: Payment): void {
    // Number() keeps the Drizzle `number` column comparable with the numeric
    // enum without tripping no-unsafe-enum-comparison.
    if (payment.status === Number(PaymentStatus.Paid)) {
      throw new HttpException(
        'Payment is already marked as paid',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Outbox worker: publishes due payment.paid events to RabbitMQ and marks the
   * row processed on success. On failure it backs off exponentially and marks
   * the row as failed after reaching the maximum number of attempts.
   */
  @Cron('*/10 * * * * *')
  async processOutbox(): Promise<void> {
    const now = new Date();
    const due = await this.drizzle.db.query.paymentOutbox.findMany({
      where: and(
        eq(paymentOutbox.status, 0),
        lte(paymentOutbox.nextAttemptAt, now),
      ),
      orderBy: [asc(paymentOutbox.createdAt)],
      limit: PaymentService.OUTBOX_BATCH_SIZE,
    });

    for (const row of due) {
      try {
        await this.emitPaymentPaidEvent({
          paymentId: row.paymentId,
          orderId: row.orderId,
          userId: row.userId,
          transactionId: row.transactionId,
          paidAt: row.paidAt.toISOString(),
        });
        await this.drizzle.db
          .update(paymentOutbox)
          .set({ status: 1, processedAt: new Date() })
          .where(eq(paymentOutbox.id, row.id));
      } catch (error) {
        const attemptCount = row.attemptCount + 1;
        const reachedMax =
          attemptCount >= PaymentService.OUTBOX_MAX_ATTEMPTS;
        await this.drizzle.db
          .update(paymentOutbox)
          .set({
            attemptCount,
            nextAttemptAt: new Date(
              Date.now() + this.calculateBackoff(attemptCount),
            ),
            ...(reachedMax ? { status: 2 } : {}),
          })
          .where(eq(paymentOutbox.id, row.id));
        this.logger.warn(
          `Failed to publish payment.paid for outbox ${row.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private calculateBackoff(attemptCount: number): number {
    return Math.min(1000 * 2 ** (attemptCount - 1), 60000);
  }

  async markFailed(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Failed);
  }

  async markRefunded(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Refunded);
  }

  async cancelPayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Cancelled);
  }

  async expirePayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    return this.updatePaymentStatus(lookup, PaymentStatus.Expired);
  }

  async softDeletePayment(lookup: PaymentLookupRequest): Promise<PaymentDto> {
    const payment = await this.getPaymentOrThrow(lookup);
    const now = new Date();
    const [updated] = await this.drizzle.db
      .update(payments)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id))
      .returning();

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
    const [updated] = await this.drizzle.db
      .update(payments)
      .set({ status, updatedAt: new Date() })
      .where(eq(payments.id, payment.id))
      .returning();

    return toPaymentDto(updated);
  }

  private async getPaymentOrThrow(
    lookup: PaymentLookupRequest,
  ): Promise<Payment> {
    const whereClause = this.buildPaymentLookupWhere(lookup);
    const payment = await this.drizzle.db.query.payments.findFirst({
      where: whereClause,
    });

    if (!payment) {
      throw new HttpException('payment not found', HttpStatus.NOT_FOUND);
    }

    return payment;
  }

  private buildPaymentLookupWhere(lookup: PaymentLookupRequest): SQL {
    const id = lookup.id?.trim();
    const transactionId = lookup.transactionId?.trim();

    if (!id && !transactionId) {
      throw new HttpException(
        'id or transactionId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const conditions: SQL[] = [isNull(payments.deletedAt)];
    if (id) {
      conditions.push(eq(payments.id, id));
    }
    if (transactionId) {
      conditions.push(eq(payments.transactionId, transactionId));
    }
    return and(...conditions)!;
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
