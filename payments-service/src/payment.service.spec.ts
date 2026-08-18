import 'reflect-metadata';
import type { ClientProxy } from '@nestjs/microservices';
import type { PrismaClient } from '@prisma/client';
import { of } from 'rxjs';
import { PaymentStatus } from './payment.dto';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: {
    payment: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    paymentOutbox: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
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
      paymentOutbox: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (tx: unknown) => unknown)({
            payment: prisma.payment,
            paymentOutbox: prisma.paymentOutbox,
          });
        }
        return Promise.all(arg as Promise<unknown>[]);
      }),
    };

    orderClient = {
      emit: jest.fn(() => of(undefined)),
    };

    service = new PaymentService(
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

  it('createPayment should preserve an explicit transactionId for provider reconciliation', async () => {
    prisma.payment.create.mockResolvedValue(
      buildPaymentRecord({ transactionId: 'vnpay-txn-1' }),
    );

    await service.createPayment({
      orderId: 'order-1',
      userId: 'user-1',
      amount: '150000',
      paymentMethod: 'VNPAY',
      transactionId: ' vnpay-txn-1 ',
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        transactionId: 'vnpay-txn-1',
      }),
    });
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

  it('markPaidWorkflow should persist a payment.paid outbox row in the same transaction without emitting directly', async () => {
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
    prisma.paymentOutbox.create.mockResolvedValue({ id: 'outbox-1' });

    const result = await service.markPaidWorkflow({ id: existing.id, paidAt });

    expect(orderClient.emit).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.paymentOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentId: existing.id,
        orderId: existing.orderId,
        userId: existing.userId,
        transactionId: existing.transactionId,
        paidAt,
      }),
    });
    expect(result.payment.status).toBe(PaymentStatus.Paid);
    expect(result.event.name).toBe('payment.paid');
  });

  it('processOutbox should publish due payment.paid events and mark them processed', async () => {
    const paidAt = new Date('2026-06-12T09:00:00.000Z');
    prisma.paymentOutbox.findMany.mockResolvedValue([
      {
        id: 'outbox-1',
        paymentId: 'payment-1',
        orderId: 'order-1',
        userId: 'user-1',
        transactionId: 'txn-1',
        paidAt,
        status: 0,
        attemptCount: 0,
      },
    ]);

    await service.processOutbox();

    expect(orderClient.emit).toHaveBeenCalledWith('payment.paid', {
      paymentId: 'payment-1',
      orderId: 'order-1',
      userId: 'user-1',
      transactionId: 'txn-1',
      paidAt: paidAt.toISOString(),
    });
    expect(prisma.paymentOutbox.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: { status: 1, processedAt: expect.any(Date) },
    });
  });

  it('processOutbox should back off and eventually mark a persistently failing row as failed', async () => {
    const paidAt = new Date('2026-06-12T09:00:00.000Z');
    prisma.paymentOutbox.findMany.mockResolvedValue([
      {
        id: 'outbox-1',
        paymentId: 'payment-1',
        orderId: 'order-1',
        userId: 'user-1',
        transactionId: 'txn-1',
        paidAt,
        status: 0,
        attemptCount: 4, // one below the max of 5
      },
    ]);
    orderClient.emit.mockImplementation(() => {
      throw new Error('broker down');
    });

    await service.processOutbox();

    expect(prisma.paymentOutbox.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: expect.objectContaining({
        attemptCount: 5,
        nextAttemptAt: expect.any(Date),
        status: 2,
      }),
    });
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
        status: PaymentStatus.Pending,
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
