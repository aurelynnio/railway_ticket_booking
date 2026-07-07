import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { UserRole } from '../common/decorator/roles.decorator';
import { PaymentStatus } from './payment.dto';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController workflow', () => {
  let controller: PaymentController;
  let paymentService: {
    getPaymentsByOrderId: jest.Mock;
    getPaymentById: jest.Mock;
    getPaymentsByUserId: jest.Mock;
    markPaidWorkflow: jest.Mock;
  };

  const paymentRecord = {
    id: 'payment-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: '150000',
    paymentMethod: 'VNPAY',
    status: PaymentStatus.Pending,
    transactionId: 'txn-1',
    paidAt: null,
    createdAt: '2026-06-27T00:00:00.000Z',
    updatedAt: '2026-06-27T00:00:00.000Z',
    deletedAt: null,
  };

  beforeEach(async () => {
    paymentService = {
      getPaymentsByOrderId: jest.fn(),
      getPaymentById: jest.fn(),
      getPaymentsByUserId: jest.fn(),
      markPaidWorkflow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: paymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listPaymentsByOrderId should return payments for the order owner', async () => {
    paymentService.getPaymentsByOrderId.mockReturnValue(of([paymentRecord]));

    const result = await controller.listPaymentsByOrderId(
      {
        user: {
          userId: 'user-1',
          role: UserRole.USER,
        },
      },
      'order-1',
    );

    expect(paymentService.getPaymentsByOrderId).toHaveBeenCalledWith({
      orderId: 'order-1',
    });
    expect(result).toEqual([paymentRecord]);
  });

  it('listPaymentsByOrderId should reject non-admin users requesting another owner order', async () => {
    paymentService.getPaymentsByOrderId.mockReturnValue(
      of([{ ...paymentRecord, userId: 'user-2' }]),
    );

    await expect(
      controller.listPaymentsByOrderId(
        {
          user: {
            userId: 'user-1',
            role: UserRole.USER,
          },
        },
        'order-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('listPaymentsByUserId should reject non-admin users requesting another user history', () => {
    expect(() =>
      controller.listPaymentsByUserId(
        {
          user: {
            userId: 'user-1',
            role: UserRole.USER,
          },
        },
        'user-2',
        { page: 1, limit: 10 },
      ),
    ).toThrow(ForbiddenException);
  });

  it('getPaymentById should allow the owner and return the payment stream', async () => {
    const payment$ = of(paymentRecord);
    paymentService.getPaymentById
      .mockReturnValueOnce(of(paymentRecord))
      .mockReturnValueOnce(payment$);

    const result = await controller.getPaymentById(
      {
        user: {
          userId: 'user-1',
          role: UserRole.USER,
        },
      },
      'payment-1',
    );

    expect(paymentService.getPaymentById).toHaveBeenNthCalledWith(1, {
      id: 'payment-1',
    });
    expect(paymentService.getPaymentById).toHaveBeenNthCalledWith(2, {
      id: 'payment-1',
    });
    expect(result).toBe(payment$);
  });

  it('getPaymentById should reject non-admin access to another user payment', async () => {
    paymentService.getPaymentById.mockReturnValue(
      of({ ...paymentRecord, userId: 'user-2' }),
    );

    await expect(
      controller.getPaymentById(
        {
          user: {
            userId: 'user-1',
            role: UserRole.USER,
          },
        },
        'payment-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('markPaid should delegate to markPaidWorkflow so the paid event still fires', () => {
    const response = {
      payment: { ...paymentRecord, status: PaymentStatus.Paid },
      event: {
        name: 'payment.paid' as const,
        orderId: 'order-1',
        emittedAt: '2026-06-27T00:05:00.000Z',
      },
    };
    paymentService.markPaidWorkflow.mockReturnValue(of(response));

    const payload = {
      id: 'payment-1',
      paidAt: new Date('2026-06-27T00:05:00.000Z'),
    };

    const result = controller.markPaid(payload);

    expect(paymentService.markPaidWorkflow).toHaveBeenCalledWith(payload);
    expect(result).toBeDefined();
  });
});
