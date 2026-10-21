import { HttpException, HttpStatus } from '@nestjs/common';
import type { DrizzleService } from '../drizzle/drizzle.service';
import {
  orderPassengers,
  orders as ordersTable,
  orderSeatLabels,
} from '../drizzle/schema';
import { of, throwError } from 'rxjs';
import { OrderStatus, type CheckoutOrderRequest } from './dto/order.dto';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let paymentClient: { send: jest.Mock };
  let ticketClient: { send: jest.Mock };
  let expirationClient: { emit: jest.Mock };
  let drizzleMock: ReturnType<typeof createMockDrizzle>;

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
    expirationClient = {
      emit: jest.fn(),
    };
    drizzleMock = createMockDrizzle();

    const notificationClient = {
      emit: jest.fn(),
    };
    const usersClient = {
      // A real ClientProxy always returns an Observable; `of(null)` models an
      // account lookup that yields no profile email.
      send: jest.fn().mockReturnValue(of(null)),
    };
    const voucherService = {
      validateAndApplyVoucher: jest.fn().mockImplementation(async (code: string, amount: number) => ({
        voucher: { id: 'v-1', code, discountType: 'FIXED', discountValue: 0 },
        discountAmount: 0,
        finalAmount: amount,
      })),
      rollbackUsage: jest.fn().mockResolvedValue(true),
      reserveUsage: jest.fn().mockResolvedValue(true),
      releaseUsage: jest.fn().mockResolvedValue(undefined),
      validateVoucher: jest.fn().mockImplementation(async (params: { code: string; orderAmount: number }) => ({
        id: 'v-1',
        voucherId: 'v-1',
        code: params.code,
        isValid: true,
        voucher: { id: 'v-1', code: params.code },
        discountType: 'FIXED',
        discountValue: 10000,
        discountAmount: BigInt(10000),
        finalAmount: BigInt(params.orderAmount - 10000),
      })),
    };

    service = new OrderService(
      drizzleMock as unknown as DrizzleService,
      voucherService as unknown as any,
      paymentClient as unknown as any,
      ticketClient as unknown as any,
      expirationClient as unknown as any,
      notificationClient as unknown as any,
      usersClient as unknown as any,
    );
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
    expect(order.totalPrice).toBe('180000');
    expect(order.status).toBe(OrderStatus.PendingPayment);
    expect(order.seatLabels).toEqual(['A1', 'A2']);
  });

  it('create should calculate discounts for special passenger types (child, student, senior)', async () => {
    const order = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 3,
      unitPrice: 100000,
      seatLabels: ['A1', 'A2', 'A3'],
      passengers: [
        {
          fullName: 'Em Be',
          passengerType: 'CHILD', // 75% -> 75,000
          identityNumber: '012345678901',
        },
        {
          fullName: 'Sinh Vien',
          passengerType: 'STUDENT', // 90% -> 90,000
          identityNumber: '012345678902',
        },
        {
          fullName: 'Nguoi Cao Tuoi',
          passengerType: 'SENIOR', // 85% -> 85,000
          identityNumber: '012345678903',
        },
      ],
    });

    // 75,000 + 90,000 + 85,000 = 250,000
    expect(order.totalPrice).toBe('250000');
  });

  it('create should charge full fare when a discounted class has no identity evidence', async () => {
    const order = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 100000,
      seatLabels: ['A1'],
      passengers: [
        {
          fullName: 'Nguoi Lon',
          passengerType: 'CHILD',
        },
      ],
    });

    expect(order.totalPrice).toBe('100000');
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
    expect(result.order.totalPrice).toBe('180000');
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

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.listByOrderId') {
        return of([
          {
            id: 'payment-1',
            orderId: created.id,
            userId: 'user-1',
            amount: '90000',
            paymentMethod: 'VNPAY',
            status: 2, // Paid
            transactionId: 'txn-1',
            paidAt: '2026-06-12T09:00:00.000Z',
            createdAt: '2026-06-12T08:00:00.000Z',
            updatedAt: '2026-06-12T09:00:00.000Z',
            deletedAt: null,
          },
        ]);
      }

      throw new Error(`Unexpected payment pattern: ${pattern}`);
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

  it('handlePaymentPaidEvent should refuse an event whose payment does not cover the order', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
    });

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.listByOrderId') {
        return of([
          {
            id: 'payment-1',
            orderId: created.id,
            userId: 'user-1',
            amount: '1',
            paymentMethod: 'VNPAY',
            status: 2,
            transactionId: 'txn-1',
            paidAt: '2026-06-12T09:00:00.000Z',
            createdAt: '2026-06-12T08:00:00.000Z',
            updatedAt: '2026-06-12T09:00:00.000Z',
            deletedAt: null,
          },
        ]);
      }

      throw new Error(`Unexpected payment pattern: ${pattern}`);
    });

    const result = await service.handlePaymentPaidEvent({
      paymentId: 'payment-1',
      orderId: created.id,
    });

    expect(result.advancedOrderStatuses).toEqual([]);
    expect(result.order.status).toBe(OrderStatus.PendingPayment);
  });

  it('handlePaymentPaidEvent should refuse an event with no settled payment', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
    });

    paymentClient.send.mockImplementation(() => of([]));

    const result = await service.handlePaymentPaidEvent({
      orderId: created.id,
    });

    expect(result.advancedOrderStatuses).toEqual([]);
    expect(result.order.status).toBe(OrderStatus.PendingPayment);
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

    paymentClient.send.mockImplementation((pattern: string) => {
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
    });

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

    // Cancellation does NOT become terminal Cancelled before compensation finishes;
    // it remains in Cancelling state so that repeating cancellation or cron can resume it!
    expect(result.order.status).toBe(OrderStatus.Cancelling);
    expect(result.cancelledPaymentIds).toEqual(['payment-1', 'payment-2']);
    expect(result.releasedSeatLabels).toEqual(['A1']);
    expect(result.releasedQuantity).toBe(2);
    expect(result.warnings).toEqual(['inventory release failed']);
  });

  it('expires only a bounded, soft-delete-aware batch of oldest pending orders', async () => {
    drizzleMock.cronLimitSpy.mockResolvedValueOnce([{ id: 'expired-order-1' }]);
    const cancelWorkflow = jest
      .spyOn(service, 'cancelWorkflow')
      .mockResolvedValue({} as never);

    await service.handleExpiredOrdersCron();

    expect(drizzleMock.cronLimitSpy).toHaveBeenCalledWith(100);
    expect(cancelWorkflow).toHaveBeenCalledWith({
      orderId: 'expired-order-1',
      payload: {
        reason: 'Order expired due to payment timeout (cron fallback)',
      },
    });
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

  it('create should use the payment method from the checkout payload', async () => {
    ticketClient.send.mockImplementation((pattern: { cmd: string }) => {
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
    });

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.create') {
        return of({ ...paymentDto, paymentMethod: 'BANKING' });
      }
      throw new Error(`Unexpected payment pattern: ${pattern}`);
    });

    await service.checkout({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'ignored-at-checkout',
      quantity: 2,
      unitPrice: 0,
      seatLabels: ['A1'],
      paymentMethod: 'BANKING',
    });

    expect(paymentClient.send).toHaveBeenCalledWith(
      'payments.create',
      expect.objectContaining({
        paymentMethod: 'BANKING',
      }),
    );
  });

  it('create should compute totalPrice with BigInt arithmetic to avoid precision loss', async () => {
    const quantity = 20;
    const unitPrice = 4503599627370497;
    const exact = BigInt(quantity) * BigInt(unitPrice);

    expect(exact).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));

    await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity,
      unitPrice,
    });

    const createCall = drizzleMock.orderInsertSpy.mock.calls[0][0];
    expect(createCall.totalPrice).toBe(exact);
  });

  it('create should reject a quantity above the configured maximum', async () => {
    await expect(
      service.create({
        userId: 'user-1',
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        ticketTitle: 'SE1',
        quantity: 1000000000,
        unitPrice: 90000,
      }),
    ).rejects.toThrow(HttpException);
  });

  it('updateSeatLabels should be disabled to prevent releasing another customer seat', async () => {
    await expect(
      service.updateSeatLabels('order-1', { seatLabels: ['B1'] }),
    ).rejects.toThrow('Direct seat label editing is disabled');
  });

  it('create should roll back and not persist order if voucher claim fails', async () => {
    const voucherService = (service as any).voucherService;
    voucherService.reserveUsage.mockResolvedValueOnce(false);

    await expect(
      service.create({
        userId: 'user-1',
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        ticketTitle: 'SE1',
        quantity: 1,
        unitPrice: 90000,
        voucherCode: 'PROMO10',
      }),
    ).rejects.toThrow('Mã khuyến mãi đã hết lượt sử dụng.');
  });

  it('handleOrderExpireCheck should fulfill instead of cancelling if payment settled before expiry', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
    });

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.listByOrderId') {
        return of([
          {
            id: 'payment-1',
            orderId: created.id,
            status: 2, // PAYMENT_STATUS.Paid
            amount: '90000',
          },
        ]);
      }
      return of({});
    });

    ticketClient.send.mockReturnValue(of({ success: true }));

    await service.handleOrderExpireCheck({ orderId: created.id });

    const orderAfter = await service.findOne(created.id);
    expect(orderAfter.status).toBe(OrderStatus.TicketIssued);
  });

  it('handlePaymentPaidEvent on cancelled order should initiate refund workflow', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
    });

    await service.cancel(created.id, { reason: 'Expired' });

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.listByOrderId') {
        return of([
          {
            id: 'payment-1',
            orderId: created.id,
            status: 2, // PAYMENT_STATUS.Paid
            amount: '90000',
          },
        ]);
      }
      if (pattern === 'payments.markRefunded') {
        return of({ success: true });
      }
      return of([]);
    });

    ticketClient.send.mockReturnValue(of({ success: true }));

    const refundSpy = jest.spyOn(service, 'refund');
    await service.handlePaymentPaidEvent({ orderId: created.id });

    expect(refundSpy).toHaveBeenCalledWith(created.id);
  });

  it('checkout should release holds on preceding seats if a subsequent seat reservation fails', async () => {
    ticketClient.send.mockImplementation((pattern: { cmd: string }, data: any) => {
      if (pattern.cmd === 'tickets.find_one') return of(ticketSnapshot);
      if (pattern.cmd === 'tickets.find_ticket_item') return of(ticketItemSnapshot);
      if (pattern.cmd === 'tickets.reserve_seat') {
        if (data.payload.seatLabel === 'A1') return of({ success: true });
        if (data.payload.seatLabel === 'A2') return throwError(() => new Error('Seat A2 conflict'));
      }
      if (pattern.cmd === 'tickets.release_seat') {
        return of({ success: true });
      }
      return of({});
    });

    await expect(
      service.checkout({
        userId: 'user-1',
        ticketId: 'ticket-1',
        ticketItemId: 'item-1',
        ticketTitle: 'SE1',
        quantity: 2,
        unitPrice: 90000,
        seatLabels: ['A1', 'A2'],
      }),
    ).rejects.toThrow('Seat A2 conflict');

    expect(ticketClient.send).toHaveBeenCalledWith(
      { cmd: 'tickets.release_seat' },
      expect.objectContaining({
        payload: { seatLabel: 'A1' },
      }),
    );
  });

  it('verifyPaymentSettledForOrder should re-throw transient RPC errors so message is not acked', async () => {
    const created = await service.create({
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
    });

    paymentClient.send.mockReturnValue(throwError(() => new Error('RPC connection refused')));

    await expect(
      service.handlePaymentPaidEvent({ orderId: created.id }),
    ).rejects.toThrow('RPC connection refused');
  });

  it('create should return the existing order when idempotencyKey is reused', async () => {
    const payload = {
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'SE1',
      quantity: 1,
      unitPrice: 90000,
      idempotencyKey: 'dup-key',
    };

    const first = await service.create(payload);
    const second = await service.create(payload);

    expect(second.id).toBe(first.id);
  });

  it('checkout should replay an existing order for a repeated idempotencyKey without reserving again', async () => {
    ticketClient.send.mockImplementation((pattern: { cmd: string }) => {
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
    });

    paymentClient.send.mockImplementation((pattern: string) => {
      if (pattern === 'payments.create') {
        return of(paymentDto);
      }
      if (pattern === 'payments.listByOrderId') {
        return of([paymentDto]);
      }
      throw new Error(`Unexpected payment pattern: ${pattern}`);
    });

    const payload = {
      userId: 'user-1',
      ticketId: 'ticket-1',
      ticketItemId: 'item-1',
      ticketTitle: 'ignored-at-checkout',
      quantity: 2,
      unitPrice: 0,
      seatLabels: ['A1'],
      paymentMethod: 'VNPAY',
      idempotencyKey: 'idem-1',
    };

    await service.checkout(payload);
    const reservesAfterFirst = ticketClient.send.mock.calls.filter(
      (call) => call[0].cmd === 'tickets.reserve_seat',
    ).length;

    const result = await service.checkout(payload);
    const reservesAfterSecond = ticketClient.send.mock.calls.filter(
      (call) => call[0].cmd === 'tickets.reserve_seat',
    ).length;

    expect(result.order.id).toBeTruthy();
    expect(reservesAfterSecond).toBe(reservesAfterFirst);
  });
});

function extractSqlColumnFilters(node: unknown): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  const walk = (item: unknown) => {
    if (!item || typeof item !== 'object') return;
    if ('queryChunks' in item && Array.isArray((item as { queryChunks: unknown[] }).queryChunks)) {
      const chunks = (item as { queryChunks: unknown[] }).queryChunks;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk && typeof chunk === 'object' && 'name' in chunk && typeof (chunk as { name: unknown }).name === 'string') {
          const colName = (chunk as { name: string }).name;
          for (let j = i + 1; j < chunks.length; j++) {
            const next = chunks[j];
            if (next && typeof next === 'object') {
              if ('encoder' in next && 'value' in next) {
                filters[colName] = (next as { value: unknown }).value;
                break;
              }
              if ('value' in next && Array.isArray((next as { value: unknown[] }).value)) {
                const str = (next as { value: unknown[] }).value.join('');
                if (str.includes('is null')) {
                  filters[colName] = null;
                  break;
                }
              }
            }
          }
        }
        walk(chunk);
      }
    }
  };
  walk(node);
  return filters;
}

function createMockDrizzle() {
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
    voucherId: string | null;
    voucherCode: string | null;
    discountAmount: bigint;
    ticketCode: string | null;
    qrPayload: string | null;
    idempotencyKey: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    cancelReason: string | null;
    status: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };

  const orders: StoredOrder[] = [];
  const seatLabels: StoredSeatLabel[] = [];
  const passengers: StoredPassenger[] = [];

  const withRelations = (order: StoredOrder) => ({
    ...order,
    seatLabels: seatLabels.filter((entry) => entry.orderId === order.id),
    passengers: passengers.filter((entry) => entry.orderId === order.id),
  });

  const matchesSql = (order: StoredOrder, where?: unknown): boolean => {
    if (!where) return true;
    const filters = extractSqlColumnFilters(where);
    if ('id' in filters && order.id !== filters.id) return false;
    if ('idempotency_key' in filters && order.idempotencyKey !== filters.idempotency_key) return false;
    if ('user_id' in filters && order.userId !== filters.user_id) return false;
    if ('status' in filters && order.status !== filters.status) return false;
    if ('deleted_at' in filters && order.deletedAt !== filters.deleted_at) return false;
    return true;
  };

  const orderInsertSpy = jest.fn();
  const cronLimitSpy = jest.fn().mockResolvedValue([]);

  const db = {
    query: {
      orders: {
        findFirst: jest.fn(async ({ where }: { where?: unknown } = {}) => {
          const found = orders.find((o) => matchesSql(o, where));
          return found ? withRelations(found) : undefined;
        }),
        findMany: jest.fn(
          async ({
            where,
            offset = 0,
            limit = orders.length || 10,
          }: {
            where?: unknown;
            offset?: number;
            limit?: number;
          } = {}) => {
            return orders
              .filter((o) => matchesSql(o, where))
              .slice(offset, offset + limit)
              .map(withRelations);
          },
        ),
      },
    },
    insert: jest.fn((table: unknown) => ({
      values: jest.fn((data: unknown) => ({
        returning: jest.fn(async () => {
          if (table === ordersTable) {
            const input = data as Partial<StoredOrder>;
            orderInsertSpy(input);
            if (
              input.idempotencyKey &&
              orders.some((entry) => entry.idempotencyKey === input.idempotencyKey)
            ) {
              throw Object.assign(new Error('Unique constraint failed'), {
                code: '23505',
              });
            }
            const id = `order-${orders.length + 1}`;
            const now = new Date('2026-06-12T08:00:00.000Z');
            const created: StoredOrder = {
              id,
              userId: input.userId!,
              ticketItemId: input.ticketItemId!,
              ticketId: input.ticketId!,
              ticketTitle: input.ticketTitle!,
              trainNumber: input.trainNumber ?? null,
              departureStationCode: input.departureStationCode ?? null,
              departureStationName: input.departureStationName ?? null,
              arrivalStationCode: input.arrivalStationCode ?? null,
              arrivalStationName: input.arrivalStationName ?? null,
              departureTime: input.departureTime ?? null,
              arrivalTime: input.arrivalTime ?? null,
              coachCode: input.coachCode ?? null,
              seatClass: input.seatClass ?? null,
              seatType: input.seatType ?? null,
              quantity: input.quantity!,
              unitPrice: input.unitPrice!,
              totalPrice: input.totalPrice!,
              voucherId: input.voucherId ?? null,
              voucherCode: input.voucherCode ?? null,
              discountAmount: input.discountAmount ?? BigInt(0),
              ticketCode: null,
              qrPayload: null,
              idempotencyKey: input.idempotencyKey ?? null,
              contactEmail: input.contactEmail ?? null,
              contactPhone: input.contactPhone ?? null,
              cancelReason: null,
              status: input.status ?? 0,
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            };
            orders.unshift(created);
            return [created];
          }
          if (table === orderSeatLabels) {
            const rows = Array.isArray(data) ? (data as StoredSeatLabel[]) : [data as StoredSeatLabel];
            seatLabels.push(...rows);
            return rows;
          }
          if (table === orderPassengers) {
            const rows = Array.isArray(data) ? (data as StoredPassenger[]) : [data as StoredPassenger];
            passengers.push(...rows);
            return rows;
          }
          return [];
        }),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn((data: Partial<StoredOrder>) => ({
        where: jest.fn((where?: unknown) => {
          const matched = orders.filter((o) => matchesSql(o, where));
          for (const o of matched) {
            Object.assign(o, data, { updatedAt: new Date() });
          }
          const promise = Promise.resolve(matched);
          return Object.assign(promise, {
            returning: jest.fn(async () => matched),
          });
        }),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(async () => []),
    })),
    select: jest.fn((fields?: Record<string, unknown>) => ({
      from: jest.fn(() => ({
        where: jest.fn((where?: unknown) => {
          if (fields && 'total' in fields) {
            return Promise.resolve([
              { total: orders.filter((o) => matchesSql(o, where)).length },
            ]);
          }
          return {
            orderBy: jest.fn(() => ({
              limit: cronLimitSpy,
            })),
          };
        }),
      })),
    })),
    transaction: jest.fn(),
  };
  db.transaction.mockImplementation(
    async (cb: (tx: unknown) => Promise<unknown>) => cb(db),
  );

  return {
    db,
    orderInsertSpy,
    cronLimitSpy,
  };
}
