import 'reflect-metadata';
import type { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { PaymentStatus } from './dto/payment.dto';
import { PaymentService } from './payment.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { paymentOutbox, payments } from '../drizzle/schema';

describe('PaymentService', () => {
  let service: PaymentService;
  let dbMock: {
    query: {
      payments: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
      };
      paymentOutbox: {
        findMany: jest.Mock;
      };
    };
    insert: jest.Mock;
    update: jest.Mock;
    select: jest.Mock;
    transaction: jest.Mock;
    insertValuesSpy: jest.Mock;
    insertReturningSpy: jest.Mock;
    updateSetSpy: jest.Mock;
    updateWhereSpy: jest.Mock;
    updateReturningSpy: jest.Mock;
    selectFromWhereSpy: jest.Mock;
  };
  let orderClient: { emit: jest.Mock };

  const buildPaymentRecord = (
    overrides: Partial<Record<string, unknown>> = {},
  ) => ({
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
    const insertReturningSpy = jest.fn().mockResolvedValue([buildPaymentRecord()]);
    const insertValuesSpy = jest.fn().mockImplementation(() => {
      const promise = Promise.resolve([{ id: 'outbox-1' }]);
      return Object.assign(promise, {
        returning: insertReturningSpy,
      });
    });

    const updateReturningSpy = jest.fn().mockResolvedValue([buildPaymentRecord()]);
    const updateWhereSpy = jest.fn().mockImplementation(() => {
      const promise = Promise.resolve([]);
      return Object.assign(promise, {
        returning: updateReturningSpy,
      });
    });
    const updateSetSpy = jest.fn().mockImplementation(() => ({
      where: updateWhereSpy,
    }));

    const selectFromWhereSpy = jest.fn().mockResolvedValue([{ total: 1 }]);

    dbMock = {
      query: {
        payments: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        paymentOutbox: {
          findMany: jest.fn(),
        },
      },
      insert: jest.fn().mockImplementation(() => ({
        values: insertValuesSpy,
      })),
      update: jest.fn().mockImplementation(() => ({
        set: updateSetSpy,
      })),
      select: jest.fn().mockImplementation(() => ({
        from: jest.fn().mockImplementation(() => ({
          where: selectFromWhereSpy,
        })),
      })),
      transaction: jest.fn().mockImplementation(async (cb) => cb(dbMock)),
      insertValuesSpy,
      insertReturningSpy,
      updateSetSpy,
      updateWhereSpy,
      updateReturningSpy,
      selectFromWhereSpy,
    };

    orderClient = {
      emit: jest.fn(() => of(undefined)),
    };

    service = new PaymentService(
      { db: dbMock } as unknown as DrizzleService,
      orderClient as unknown as ClientProxy,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createPayment should parse amount and persist a pending payment', async () => {
    dbMock.insertReturningSpy.mockResolvedValue([buildPaymentRecord()]);

    const result = await service.createPayment({
      orderId: ' order-1 ',
      userId: ' user-1 ',
      amount: '150000',
      paymentMethod: ' VNPAY ',
    });

    expect(dbMock.insert).toHaveBeenCalledWith(payments);
    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        userId: 'user-1',
        amount: BigInt(150000),
        paymentMethod: 'VNPAY',
        status: PaymentStatus.Pending,
      }),
    );
    expect(result.amount).toBe('150000');
    expect(result.status).toBe(PaymentStatus.Pending);
  });

  it('createPayment should preserve an explicit transactionId for provider reconciliation', async () => {
    dbMock.insertReturningSpy.mockResolvedValue([
      buildPaymentRecord({ transactionId: 'vnpay-txn-1' }),
    ]);

    await service.createPayment({
      orderId: 'order-1',
      userId: 'user-1',
      amount: '150000',
      paymentMethod: 'VNPAY',
      transactionId: ' vnpay-txn-1 ',
    });

    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'vnpay-txn-1',
      }),
    );
  });

  it('markPaid should update status and paidAt', async () => {
    const existing = buildPaymentRecord();
    const paidAt = new Date('2026-06-12T09:00:00.000Z');

    dbMock.query.payments.findFirst.mockResolvedValue(existing);
    dbMock.updateReturningSpy.mockResolvedValue([
      buildPaymentRecord({
        status: PaymentStatus.Paid,
        paidAt,
        updatedAt: paidAt,
      }),
    ]);

    const result = await service.markPaid({ id: existing.id, paidAt });

    expect(dbMock.update).toHaveBeenCalledWith(payments);
    expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PaymentStatus.Paid,
        paidAt,
      }),
    );
    expect(result.status).toBe(PaymentStatus.Paid);
    expect(result.paidAt).toBe(paidAt.toISOString());
  });

  it('markPaidWorkflow should persist a payment.paid outbox row in the same transaction without emitting directly', async () => {
    const existing = buildPaymentRecord();
    const paidAt = new Date('2026-06-12T09:00:00.000Z');

    dbMock.query.payments.findFirst.mockResolvedValue(existing);
    dbMock.updateReturningSpy.mockResolvedValue([
      buildPaymentRecord({
        status: PaymentStatus.Paid,
        paidAt,
        updatedAt: paidAt,
      }),
    ]);

    const result = await service.markPaidWorkflow({ id: existing.id, paidAt });

    expect(orderClient.emit).not.toHaveBeenCalled();
    expect(dbMock.transaction).toHaveBeenCalled();
    expect(dbMock.insert).toHaveBeenCalledWith(paymentOutbox);
    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: existing.id,
        orderId: existing.orderId,
        userId: existing.userId,
        transactionId: existing.transactionId,
        paidAt,
      }),
    );
    expect(result.payment.status).toBe(PaymentStatus.Paid);
    expect(result.event.name).toBe('payment.paid');
  });

  it('processOutbox should publish due payment.paid events and mark them processed', async () => {
    const paidAt = new Date('2026-06-12T09:00:00.000Z');
    dbMock.query.paymentOutbox.findMany.mockResolvedValue([
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
    expect(dbMock.update).toHaveBeenCalledWith(paymentOutbox);
    expect(dbMock.updateSetSpy).toHaveBeenCalledWith({
      status: 1,
      processedAt: expect.any(Date),
    });
  });

  it('processOutbox should back off and eventually mark a persistently failing row as failed', async () => {
    const paidAt = new Date('2026-06-12T09:00:00.000Z');
    dbMock.query.paymentOutbox.findMany.mockResolvedValue([
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

    expect(dbMock.update).toHaveBeenCalledWith(paymentOutbox);
    expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptCount: 5,
        nextAttemptAt: expect.any(Date),
        status: 2,
      }),
    );
  });

  it('listPayments should build filters and pagination from the incoming query', async () => {
    dbMock.selectFromWhereSpy.mockResolvedValue([{ total: 1 }]);
    dbMock.query.payments.findMany.mockResolvedValue([
      buildPaymentRecord({
        transactionId: 'txn-2',
        paymentMethod: 'BANKING',
      }),
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

    expect(dbMock.transaction).toHaveBeenCalled();
    expect(dbMock.query.payments.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 1,
        limit: 1,
      }),
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0].paymentMethod).toBe('BANKING');
  });
});
