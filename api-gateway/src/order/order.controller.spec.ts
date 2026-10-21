import { ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { UserRole } from '../common/decorators/roles.decorator';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStatus } from './order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: {
    health: jest.Mock;
    checkout: jest.Mock;
    create: jest.Mock;
    list: jest.Mock;
    findOne: jest.Mock;
    summary: jest.Mock;
    updatePassengers: jest.Mock;
    updateSeatLabels: jest.Mock;
    markPendingPayment: jest.Mock;
    markPaid: jest.Mock;
    cancel: jest.Mock;
    refund: jest.Mock;
    remove: jest.Mock;
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    status: OrderStatus.PendingPayment,
    totalPrice: '90000',
    seatLabels: [{ seatLabel: 'A1' }],
  };

  beforeEach(async () => {
    orderService = {
      health: jest.fn(),
      checkout: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      findOne: jest.fn(),
      summary: jest.fn(),
      updatePassengers: jest.fn(),
      updateSeatLabels: jest.fn(),
      markPendingPayment: jest.fn(),
      markPaid: jest.fn(),
      cancel: jest.fn(),
      refund: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updateSeatLabels should throw BAD_REQUEST to protect seat integrity', async () => {
    orderService.findOne.mockReturnValue(of(mockOrder));

    await expect(
      controller.updateSeatLabels(
        { user: { userId: 'user-1', role: UserRole.USER } },
        'order-1',
        { seatLabels: ['A2'] },
      ),
    ).rejects.toThrow(
      new HttpException(
        'Direct seat label editing is disabled. Seats must be selected during checkout reservation.',
        HttpStatus.BAD_REQUEST,
      ),
    );
  });

  it('assertOrderOwnership should prevent non-owner user from accessing order', async () => {
    orderService.findOne.mockReturnValue(of(mockOrder));

    await expect(
      controller.findOne(
        { user: { userId: 'user-2', role: UserRole.USER } },
        'order-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('admin should bypass ownership check', async () => {
    orderService.findOne.mockReturnValue(of(mockOrder));

    const result = await controller.findOne(
      { user: { userId: 'admin-1', role: UserRole.ADMIN } },
      'order-1',
    );
    expect(result).toBeDefined();
  });
});
