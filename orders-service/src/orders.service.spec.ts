import { HttpException, HttpStatus } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import type { PrismaClient } from '@prisma/client';
import { of, throwError } from 'rxjs';
import { OrderStatus, type CheckoutOrderRequest } from './orders.dto';
import { CheckoutSagaOrchestrator } from './checkout-saga.orchestrator';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let paymentClient: { send: jest.Mock };
  let ticketClient: { send: jest.Mock };
  let prisma: ReturnType<typeof createMockPrisma>;

  const ticketSnapshot = {
    id: 'ticket-1',
    title: 'SE1 Ha Noi - Da Nang',
    trainNumber: 'SE1',
    departureStationCode: 'HN',
    departureStationName: 'Ha Noi',
    arrivalStationCode: 'DN',
    arrivalStationName: 'Da Nang',
    dateStart: '2026-06-12T08:00:00.000Z',
    dateEnd: '2026-06-12T20:00:00.000Z',
  };

  const ticketItemSnapshot = {
    id: 'item-1',
    ticketId: 'ticket-1',
    coachCode: 'A1',
    seatClass: 'soft-seat',
    seatType: 'window',
    priceOriginal: 100000,
    priceFlash: 90000,
    stockAvailable: 10,
    availableSeatLabels: ['A1', 'A2', 'A3'],
  };

  const paymentDto = {
    id: 'payment-1',
    orderId: 'order-1',
    userId: 'user-1',
    amount: '180000',
    paymentMethod: 'VNPAY',
    status: 0,
    transactionId: 'txn-1',
    paidAt: null,
    createdAt: '2026-06-12T08:00:00.000Z',
    updatedAt: '2026-06-12T08:00:00.000Z',
    deletedAt: null,
  };

  beforeEach(() => {
    paymentClient = {
      send: jest.fn(),
    };
    ticketClient = {
      send: jest.fn(),
    };
    prisma = createMockPrisma();

    const orchestrator = new CheckoutSagaOrchestrator(
      null as any,
      prisma as unknown as PrismaClient,
      paymentClient as unknown as ClientProxy,
      ticketClient as unknown as ClientProxy,
    );

    service = new OrdersService(
      prisma as unknown as PrismaClient,
      orchestrator,
    );

    (orchestrator as any).ordersService = service;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create should normalize the order and compute the total price', async () => {
    const order = await service.create({
      userId: ' user-1 ',
      ticketId: ' ticket-1 ',
      ticketItemId: ' item-1 ',
      ticketTitle: ' SE1 ',
      quantity: 2,
      unitPrice: 90000,
      seatLabels: ['A1', 'A2'],
      passengers: [
        {
          fullName: 'Nguyen Van A',
          passengerType: 'adult',
        },
      ],
    });

    expect(order.userId).toBe('user-1');
    expect(order.ticketId).toBe('ticket-1');
    expect(order.ticketItemId).toBe('item-1');
    expect(order.totalPrice).toBe(180000);
    expect(order.status).toBe(OrderStatus.PendingPayment);
    expect(order.seatLabels).toEqual(['A1', 'A2']);
  });

  it('checkout should reserve inventory and create a payment', async () => {
    const sendTicket = ticketClient.send.mockImplementation(
      (pattern: { cmd: string }) => {
        switch (pattern.cmd) {
          case 'tickets.find_one':
            return of(ticketSnapshot);
          case 'tickets.find_ticket_item':
            return of(ticketItemSnapshot);
          case 'tickets.reserve_seat':
          case 'tickets.reserve':
            return of({ success: true });
          default:
            throw new Error(`Unexpected ticket pattern: ${pattern.cmd}`);
        }
      },
    );

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.create') {
        return of(paymentDto);
      }

      throw new Error(`Unexpected payment pattern: ${pattern}`);
    });

    const payload: CheckoutOrderRequest = {
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'ignored-at-checkout',
      quantity: 2,
      unitPrice: 0,
      seatLabels: ['A1'],
      passengers: [
        {
          fullName: 'Nguyen Van A',
          passengerType: 'adult',
        },
      ],
      paymentMethod: 'VNPAY',
    };

    const result = await service.checkout(payload);

    expect(result.order.ticketTitle).toBe(ticketSnapshot.title);
    expect(result.order.totalPrice).toBe(180000);
    expect(result.reservation.reservedSeatLabels).toEqual(['A1']);
    expect(result.reservation.reservedQuantity).toBe(2);

    expect(sendTicket).toHaveBeenCalledWith(
      { cmd: 'tickets.reserve_seat' },
      {
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        payload: { seatLabel: 'A1' },
      },
    );
    expect(sendTicket).toHaveBeenCalledWith(
      { cmd: 'tickets.reserve' },
      {
        ticketId: 'ticket-1',
        payload: { ticketItemId: 'item-1', quantity: 1 },
      },
    );
    expect(paymentClient.send).toHaveBeenCalledWith(
      'payments.create',
      expect.objectContaining({
        userId: 'user-1',
        amount: '180000',
        paymentMethod: 'VNPAY',
      }),
    );
  });

  it('checkout should release reservations and cancel the compensating order on payment failure', async () => {
    ticketClient.send.mockImplementation((pattern: { cmd: string }) => {
      switch (pattern.cmd) {
        case 'tickets.find_one':
          return of(ticketSnapshot);
        case 'tickets.find_ticket_item':
          return of(ticketItemSnapshot);
        case 'tickets.reserve_seat':
        case 'tickets.reserve':
        case 'tickets.release_seat':
        case 'tickets.release':
          return of({ success: true });
        default:
          throw new Error(`Unexpected ticket pattern: ${pattern.cmd}`);
      }
    });

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.create') {
        return throwError(() => new Error('payment provider failed'));
      }

      throw new Error(`Unexpected payment pattern: ${pattern}`);
    });

    await expect(
      service.checkout({
        userId: 'user-1',
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        ticketTitle: 'ignored-at-checkout',
        quantity: 2,
        unitPrice: 0,
        seatLabels: ['A1'],
        paymentMethod: 'VNPAY',
      }),
    ).rejects.toThrow('payment provider failed');

    expect(ticketClient.send).toHaveBeenCalledWith(
      { cmd: 'tickets.release_seat' },
      {
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        payload: { seatLabel: 'A1' },
      },
    );
    expect(ticketClient.send).toHaveBeenCalledWith(
      { cmd: 'tickets.release' },
      {
        ticketId: 'ticket-1',
        payload: { ticketItemId: 'item-1', quantity: 1 },
      },
    );
    expect((await service.list()).data[0].status).toBe(OrderStatus.Cancelled);
  });

  it('handlePaymentPaidEvent should advance a pending payment order to ticket issued', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
    });

    const result = await service.handlePaymentPaidEvent({
      paymentId: 'payment-1',
      orderId: created.id,
      userId: 'user-1',
      transactionId: 'txn-1',
      paidAt: '2026-06-12T09:00:00.000Z',
    });

    expect(result.advancedOrderStatuses).toEqual([
      OrderStatus.Paid,
      OrderStatus.Confirmed,
      OrderStatus.TicketIssued,
    ]);
    expect(result.order.status).toBe(OrderStatus.TicketIssued);
    expect(result.order.ticketCode).toBeTruthy();
    expect(result.order.qrPayload).toBeTruthy();
  });

  it('cancelWorkflow should cancel pending payments and collect downstream warnings', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 2,
      unitPrice: 90000,
      seatLabels: ['A1'],
    });

    paymentClient.send.mockImplementation(
      (pattern: string, payload: unknown) => {
        if (pattern === 'payments.listByOrderId') {
          return of([
            { id: 'payment-1', status: 0 },
            { id: 'payment-2', status: 1 },
            { id: 'payment-3', status: 2 },
          ]);
        }

        if (pattern === 'payments.cancel') {
          return of({ success: true });
        }

        throw new Error(`Unexpected payment pattern: ${pattern}`);
      },
    );

    ticketClient.send.mockImplementation((pattern: { cmd: string }) => {
      if (pattern.cmd === 'tickets.release_seat') {
        return of({ success: true });
      }

      if (pattern.cmd === 'tickets.release') {
        return throwError(() => new Error('inventory release failed'));
      }

      throw new Error(`Unexpected ticket pattern: ${pattern.cmd}`);
    });

    const result = await service.cancelWorkflow({ orderId: created.id });

    expect(result.order.status).toBe(OrderStatus.Cancelled);
    expect(result.cancelledPaymentIds).toEqual(['payment-1', 'payment-2']);
    expect(result.releasedSeatLabels).toEqual(['A1']);
    expect(result.releasedQuantity).toBe(2);
    expect(result.warnings).toEqual([
      'inventory release failed',
    ]);
  });

  it('create should reject seat labels that exceed quantity', async () => {
    await expect(
      service.create({
        userId: 'user-1',
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        ticketTitle: 'SE1',
        quantity: 1,
        unitPrice: 90000,
        seatLabels: ['A1', 'A2'],
      }),
    ).rejects.toThrow(
      new HttpException(
        'seatLabels cannot exceed quantity',
        HttpStatus.BAD_REQUEST,
      ),
    );
  });
});

function createMockPrisma() {
  type StoredSeatLabel = { orderId: string; seatLabel: string };
  type StoredPassenger = {
    orderId: string;
    fullName: string;
    passengerType: string;
    identityNumber: string | null;
    phoneNumber: string | null;
  };
  type StoredOrder = {
    id: string;
    userId: string;
    ticketItemId: string;
    ticketId: string;
    ticketTitle: string;
    trainNumber: string | null;
    departureStationCode: string | null;
    departureStationName: string | null;
    arrivalStationCode: string | null;
    arrivalStationName: string | null;
    departureTime: Date | null;
    arrivalTime: Date | null;
    coachCode: string | null;
    seatClass: string | null;
    seatType: string | null;
    quantity: number;
    unitPrice: bigint;
    totalPrice: bigint;
    ticketCode: string | null;
    qrPayload: string | null;
    status: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
  type StoredOrderWithRelations = StoredOrder & {
    seatLabels: StoredSeatLabel[];
    passengers: StoredPassenger[];
  };
  type CreateOrderArgs = {
    data: Omit<
      StoredOrder,
      | 'id'
      | 'ticketCode'
      | 'qrPayload'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
    > & {
      seatLabels: { create: Omit<StoredSeatLabel, 'orderId'>[] };
      passengers: { create: Omit<StoredPassenger, 'orderId'>[] };
    };
  };
  type WhereArgs = { where?: Record<string, unknown> };
  type FindManyArgs = WhereArgs & { skip?: number; take?: number };
  type UpdateOrderArgs = {
    where: { id: string };
    data: Partial<StoredOrder>;
  };
  type DeleteManyArgs = { where: { orderId: string } };
  type CreatePassengerArgs = { data: StoredPassenger };
  type CreateSeatLabelArgs = { data: StoredSeatLabel };

  const orders: StoredOrder[] = [];
  const seatLabels: StoredSeatLabel[] = [];
  const passengers: StoredPassenger[] = [];

  const withRelations = (order: StoredOrder): StoredOrderWithRelations => ({
    ...order,
    seatLabels: seatLabels.filter((entry) => entry.orderId === order.id),
    passengers: passengers.filter((entry) => entry.orderId === order.id),
  });

  const matchesWhere = (
    order: StoredOrder,
    where: Record<string, unknown> = {},
  ) =>
    Object.entries(where).every(([key, value]) => {
      if (value === null) {
        return order[key as keyof StoredOrder] === null;
      }

      return order[key as keyof StoredOrder] === value;
    });

  return {
    order: {
      create: jest.fn(
        ({ data }: CreateOrderArgs): Promise<StoredOrderWithRelations> => {
          const id = `order-${orders.length + 1}`;
          const now = new Date('2026-06-12T08:00:00.000Z');
          const order: StoredOrder = {
            id,
            userId: data.userId,
            ticketItemId: data.ticketItemId,
            ticketId: data.ticketId,
            ticketTitle: data.ticketTitle,
            trainNumber: data.trainNumber,
            departureStationCode: data.departureStationCode,
            departureStationName: data.departureStationName,
            arrivalStationCode: data.arrivalStationCode,
            arrivalStationName: data.arrivalStationName,
            departureTime: data.departureTime,
            arrivalTime: data.arrivalTime,
            coachCode: data.coachCode,
            seatClass: data.seatClass,
            seatType: data.seatType,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            totalPrice: data.totalPrice,
            ticketCode: null,
            qrPayload: null,
            status: data.status,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };

          orders.unshift(order);
          for (const entry of data.seatLabels.create) {
            seatLabels.push({ orderId: id, seatLabel: entry.seatLabel });
          }
          for (const entry of data.passengers.create) {
            passengers.push({ orderId: id, ...entry });
          }

          return Promise.resolve(withRelations(order));
        },
      ),
      count: jest.fn(({ where }: WhereArgs): Promise<number> => {
        return Promise.resolve(
          orders.filter((order) => matchesWhere(order, where)).length,
        );
      }),
      findMany: jest.fn(
        ({
          where,
          skip = 0,
          take = orders.length,
        }: FindManyArgs): Promise<StoredOrderWithRelations[]> => {
          return Promise.resolve(
            orders
              .filter((order) => matchesWhere(order, where))
              .slice(skip, skip + take)
              .map(withRelations),
          );
        },
      ),
      findFirst: jest.fn(
        ({ where }: WhereArgs): Promise<StoredOrderWithRelations | null> => {
          const order = orders.find((entry) => matchesWhere(entry, where));
          return Promise.resolve(order ? withRelations(order) : null);
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: UpdateOrderArgs): Promise<StoredOrderWithRelations> => {
          const order = orders.find((entry) => entry.id === where.id);
          if (!order) {
            return Promise.reject(new Error(`Order ${where.id} was not found`));
          }

          Object.assign(order, data, { updatedAt: new Date() });
          return Promise.resolve(withRelations(order));
        },
      ),
    },
    orderPassenger: {
      deleteMany: jest.fn(({ where }: DeleteManyArgs): Promise<void> => {
        for (let index = passengers.length - 1; index >= 0; index -= 1) {
          if (passengers[index].orderId === where.orderId) {
            passengers.splice(index, 1);
          }
        }

        return Promise.resolve();
      }),
      create: jest.fn(
        ({ data }: CreatePassengerArgs): Promise<StoredPassenger> => {
          passengers.push(data);
          return Promise.resolve(data);
        },
      ),
    },
    orderSeatLabel: {
      deleteMany: jest.fn(({ where }: DeleteManyArgs): Promise<void> => {
        for (let index = seatLabels.length - 1; index >= 0; index -= 1) {
          if (seatLabels[index].orderId === where.orderId) {
            seatLabels.splice(index, 1);
          }
        }

        return Promise.resolve();
      }),
      create: jest.fn(
        ({ data }: CreateSeatLabelArgs): Promise<StoredSeatLabel> => {
          seatLabels.push(data);
          return Promise.resolve(data);
        },
      ),
    },
    $transaction: jest.fn(
      (operations: Promise<unknown>[]): Promise<unknown[]> =>
        Promise.all(operations),
    ),
  };
}
