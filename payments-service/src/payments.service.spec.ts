import 'reflect-metadata';
import type { ClientProxy } from '@nestjs/microservices';
import type { PrismaClient } from '@prisma/client';
import { of } from 'rxjs';
import { PaymentStatus } from './payment.dto';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let orderClient: { emit: jest.Mock };

  const buildPaymentRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'payment-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: BigInt(150000),
    paymentMethod: 'VNPAY',
    status: PaymentStatus.Pending,
    transactionId: 'txn-1',
    paidAt: null,
    createdAt: new Date('2026-06-12T08:00:00.000Z'),
    updatedAt: new Date('2026-06-12T08:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    orderClient = {
      emit: jest.fn(() => of(undefined)),
    };

    service = new PaymentsService(
      prisma as unknown as PrismaClient,
      orderClient as unknown as ClientProxy,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createPayment should parse amount and persist a pending payment', async () => {
    prisma.payment.create.mockResolvedValue(buildPaymentRecord());

    const result = await service.createPayment({
      orderId: ' order-1 ',
      userId: ' user-1 ',
      amount: '150000',
      paymentMethod: ' VNPAY ',
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        userId: 'user-1',
        amount: BigInt(150000),
        paymentMethod: 'VNPAY',
        status: PaymentStatus.Pending,
      }),
    });
    expect(result.amount).toBe('150000');
    expect(result.status).toBe(PaymentStatus.Pending);
  });

  it('markPaid should update status and paidAt', async () => {
    const existing = buildPaymentRecord();
    const paidAt = new Date('2026-06-12T09:00:00.000Z');

    prisma.payment.findFirst.mockResolvedValue(existing);
    prisma.payment.update.mockResolvedValue(
      buildPaymentRecord({
        status: PaymentStatus.Paid,
        paidAt,
        updatedAt: paidAt,
      }),
    );

    const result = await service.markPaid({ id: existing.id, paidAt });

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: {
        status: PaymentStatus.Paid,
        paidAt,
      },
    });
    expect(result.status).toBe(PaymentStatus.Paid);
    expect(result.paidAt).toBe(paidAt.toISOString());
  });

  it('markPaidWorkflow should emit the payment.paid event after updating the payment', async () => {
    const existing = buildPaymentRecord();
    const paidAt = new Date('2026-06-12T09:00:00.000Z');

    prisma.payment.findFirst.mockResolvedValue(existing);
    prisma.payment.update.mockResolvedValue(
      buildPaymentRecord({
        status: PaymentStatus.Paid,
        paidAt,
        updatedAt: paidAt,
      }),
    );

    const result = await service.markPaidWorkflow({ id: existing.id, paidAt });

    expect(orderClient.emit).toHaveBeenCalledWith('payment.paid', {
      paymentId: existing.id,
      orderId: existing.orderId,
      userId: existing.userId,
      transactionId: existing.transactionId,
      paidAt: paidAt.toISOString(),
    });
    expect(result.payment.status).toBe(PaymentStatus.Paid);
    expect(result.event.name).toBe('payment.paid');
    expect(result.event.orderId).toBe(existing.orderId);
  });

  it('listPayments should build filters and pagination from the incoming query', async () => {
    prisma.payment.count.mockReturnValue('count-query');
    prisma.payment.findMany.mockReturnValue('find-many-query');
    prisma.$transaction.mockResolvedValue([
      1,
      [
        buildPaymentRecord({
          transactionId: 'txn-2',
          paymentMethod: 'BANKING',
        }),
      ],
    ]);

    const result = await service.listPayments(
      { page: 2, limit: 1 },
      {
        userId: ' user-1 ',
        orderId: ' order-1 ',
        paymentMethod: ' BANKING ',
        transactionId: ' txn-2 ',
        status: '0',
      },
    );

    expect(prisma.payment.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        userId: 'user-1',
        orderId: 'order-1',
        paymentMethod: 'BANKING',
        transactionId: 'txn-2',
        status: 0,
      },
    });
    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        userId: 'user-1',
        orderId: 'order-1',
        paymentMethod: 'BANKING',
        transactionId: 'txn-2',
        status: 0,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 1,
      take: 1,
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'count-query',
      'find-many-query',
    ]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0].paymentMethod).toBe('BANKING');
  });
});
