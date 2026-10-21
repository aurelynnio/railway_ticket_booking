import 'reflect-metadata';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { DrizzleService } from '../drizzle/drizzle.service';
import {
  tickets as ticketsTable,
  ticketItems as ticketItemsTable,
  type TicketItem,
} from '../drizzle/schema';
import { RedisCacheService } from '../redis/redis.service';
import { TicketStatus } from './dto/ticket.dto';
import { TicketService } from './ticket.service';
import type { TicketWithItems } from './utils/ticket.utils';

const TICKET_UUID = '11111111-1111-4111-8111-111111111111';
const ITEM_UUID = '22222222-2222-4222-8222-222222222222';

describe('TicketService', () => {
  let service: TicketService;
  let dbMock: {
    transaction: jest.Mock;
    execute: jest.Mock;
    insert: jest.Mock;
    ticketInsertValuesSpy: jest.Mock;
    ticketInsertReturningSpy: jest.Mock;
    ticketItemInsertValuesSpy: jest.Mock;
    update: jest.Mock;
    ticketUpdateSetSpy: jest.Mock;
    ticketUpdateWhereSpy: jest.Mock;
    ticketUpdateReturningSpy: jest.Mock;
    ticketItemUpdateSetSpy: jest.Mock;
    ticketItemUpdateWhereSpy: jest.Mock;
    select: jest.Mock;
    selectWhereSpy: jest.Mock;
    query: {
      tickets: {
        findMany: jest.Mock;
        findFirst: jest.Mock;
      };
    };
  };
  let redisCache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    patternDel: jest.Mock;
    acquireLock: jest.Mock;
    releaseLock: jest.Mock;
    using: jest.Mock;
  };

  const buildTicketItem = (
    overrides: Partial<TicketItem> = {},
  ): TicketItem => ({
    id: ITEM_UUID,
    ticketId: TICKET_UUID,
    name: 'Khoang 1',
    description: 'Ghe mem dieu hoa',
    coachCode: 'A1',
    seatClass: 'soft-seat',
    seatType: 'window',
    images: [],
    seatLabels: ['A01', 'A02'],
    availableSeatLabels: ['A01', 'A02'],
    stockInitial: 2,
    stockAvailable: 2,
    stockPrepared: true,
    priceOriginal: BigInt(150000),
    priceFlash: BigInt(99000),
    saleStartTime: new Date(Date.now() - 60 * 60 * 1000),
    saleEndTime: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  });

  const buildTicket = (
    overrides: Partial<TicketWithItems> = {},
  ): TicketWithItems => ({
    id: TICKET_UUID,
    title: 'Tau Sai Gon - Nha Trang',
    trainNumber: 'SE1',
    departureStationCode: 'SG',
    departureStationName: 'Sai Gon',
    arrivalStationCode: 'NT',
    arrivalStationName: 'Nha Trang',
    journeyNote: 'Dem',
    images: [],
    dateStart: new Date('2026-06-20T10:00:00.000Z'),
    dateEnd: new Date('2026-06-20T18:00:00.000Z'),
    status: TicketStatus.Draft,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    deletedAt: null,
    ticketItems: [buildTicketItem()],
    ...overrides,
  });

  beforeEach(() => {
    const ticketInsertReturningSpy = jest.fn();
    const ticketInsertValuesSpy = jest.fn(() => ({
      returning: ticketInsertReturningSpy,
    }));
    const ticketItemInsertValuesSpy = jest.fn().mockResolvedValue(undefined);

    const ticketUpdateReturningSpy = jest.fn();
    const ticketUpdateWhereSpy = jest.fn(() => ({
      returning: ticketUpdateReturningSpy,
    }));
    const ticketUpdateSetSpy = jest.fn(() => ({
      where: ticketUpdateWhereSpy,
    }));

    const ticketItemUpdateWhereSpy = jest.fn().mockResolvedValue(undefined);
    const ticketItemUpdateSetSpy = jest.fn(() => ({
      where: ticketItemUpdateWhereSpy,
    }));

    const selectWhereSpy = jest.fn().mockResolvedValue([{ total: 0 }]);

    dbMock = {
      transaction: jest.fn(),
      execute: jest.fn().mockResolvedValue({ rows: [{ id: TICKET_UUID }] }),
      insert: jest.fn((table: unknown) => {
        if (table === ticketsTable) {
          return { values: ticketInsertValuesSpy };
        }
        return { values: ticketItemInsertValuesSpy };
      }),
      ticketInsertValuesSpy,
      ticketInsertReturningSpy,
      ticketItemInsertValuesSpy,
      update: jest.fn((table: unknown) => {
        if (table === ticketsTable) {
          return { set: ticketUpdateSetSpy };
        }
        return { set: ticketItemUpdateSetSpy };
      }),
      ticketUpdateSetSpy,
      ticketUpdateWhereSpy,
      ticketUpdateReturningSpy,
      ticketItemUpdateSetSpy,
      ticketItemUpdateWhereSpy,
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: selectWhereSpy,
        })),
      })),
      selectWhereSpy,
      query: {
        tickets: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
      },
    };
    dbMock.transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(dbMock),
    );

    const mockLock = {
      release: jest.fn().mockResolvedValue(undefined),
    };

    redisCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      patternDel: jest.fn(),
      acquireLock: jest.fn().mockResolvedValue(mockLock),
      releaseLock: jest.fn().mockResolvedValue(undefined),
      using: jest.fn(
        async (
          _resources: string[],
          _ttlMs: number,
          _settings: unknown,
          routine: () => Promise<unknown>,
        ) => routine(),
      ),
    };

    service = new TicketService(
      { db: dbMock } as unknown as DrizzleService,
      redisCache as unknown as RedisCacheService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a ticket + item rows, normalize fields, and invalidate list cache', async () => {
    const created = buildTicket();
    dbMock.ticketInsertReturningSpy.mockResolvedValue([created]);
    redisCache.patternDel.mockResolvedValue(1);

    const result = await service.create({
      title: '  Tau Sai Gon - Nha Trang  ',
      trainNumber: '  SE1  ',
      departureStationCode: '  SG  ',
      arrivalStationCode: '  NT  ',
      journeyNote: '  Dem  ',
      dateStart: '2026-06-20T10:00:00.000Z',
      dateEnd: '2026-06-20T18:00:00.000Z',
      ticketItems: [
        {
          name: 'Khoang 1',
          seatLabels: ['A01', 'A02'],
          availableSeatLabels: ['A01', 'A02'],
          stockPrepared: true,
        },
      ],
    });

    expect(dbMock.insert).toHaveBeenCalledWith(ticketsTable);
    expect(dbMock.ticketInsertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        title: 'Tau Sai Gon - Nha Trang',
        trainNumber: 'SE1',
        departureStationCode: 'SG',
        arrivalStationCode: 'NT',
        journeyNote: 'Dem',
        status: TicketStatus.Draft,
      }),
    );
    expect(dbMock.insert).toHaveBeenCalledWith(ticketItemsTable);
    expect(dbMock.ticketItemInsertValuesSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        ticketId: expect.any(String),
        seatLabels: ['A01', 'A02'],
        availableSeatLabels: ['A01', 'A02'],
        stockInitial: 2,
        stockAvailable: 2,
        stockPrepared: true,
      }),
    ]);
    expect(redisCache.patternDel).toHaveBeenCalledWith('tickets:*');
    expect(result.id).toBe(created.id);
    expect(result.ticketItems).toHaveLength(1);
  });

  it('should return cached paginated tickets without hitting the database', async () => {
    const cached = {
      data: [
        {
          id: TICKET_UUID,
          title: 'Cached ticket',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };
    redisCache.get.mockResolvedValue(JSON.stringify(cached));

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(redisCache.get).toHaveBeenCalledWith(
      'tickets:{"page":1,"limit":10}',
    );
    expect(dbMock.select).not.toHaveBeenCalled();
    expect(dbMock.query.tickets.findMany).not.toHaveBeenCalled();
    expect(result).toEqual(cached);
  });

  it('should query database and cache the paginated result on list cache miss', async () => {
    const ticket = buildTicket();
    redisCache.get.mockResolvedValue(null);
    redisCache.set.mockResolvedValue('OK');
    dbMock.selectWhereSpy.mockResolvedValue([{ total: 1 }]);
    dbMock.query.tickets.findMany.mockResolvedValue([ticket]);

    const result = await service.findAll({
      departureStationCode: ' SG ',
      arrivalStationCode: 'NT',
      status: `${TicketStatus.Draft}`,
      dateStart: '2026-06-20T10:00:00.000Z',
      page: 2,
      limit: 5,
    });

    expect(dbMock.selectWhereSpy).toHaveBeenCalledTimes(1);
    expect(dbMock.query.tickets.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        with: { ticketItems: true },
        offset: 5,
        limit: 5,
      }),
    );
    expect(redisCache.set).toHaveBeenCalledWith(
      'tickets:{"departureStationCode":" SG ","arrivalStationCode":"NT","status":"0","dateStart":"2026-06-20T10:00:00.000Z","page":2,"limit":5}',
      JSON.stringify(result),
      300,
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0].id).toBe(ticket.id);
  });

  it('should reserve a seat inside a FOR UPDATE row lock and invalidate derived caches', async () => {
    const ticket = buildTicket();
    dbMock.query.tickets.findFirst.mockResolvedValue(ticket);
    redisCache.del.mockResolvedValue(1);
    redisCache.patternDel.mockResolvedValue(1);

    const result = await service.reserveSeat(TICKET_UUID, ITEM_UUID, {
      seatLabel: 'A01',
    });

    // Row lock taken on the ticket row before reading/writing
    expect(dbMock.execute).toHaveBeenCalled();
    expect(dbMock.transaction).toHaveBeenCalledTimes(1);

    // Single-row UPDATE on ticket_items — no more full-array overwrite
    expect(dbMock.update).toHaveBeenCalledWith(ticketItemsTable);
    expect(dbMock.ticketItemUpdateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        availableSeatLabels: ['A02'],
        stockAvailable: 1,
      }),
    );
    expect(dbMock.ticketUpdateSetSpy).not.toHaveBeenCalled();

    expect(redisCache.del).toHaveBeenCalledWith(`ticket:${TICKET_UUID}`);
    expect(redisCache.del).toHaveBeenCalledWith(
      `ticket:availability:${TICKET_UUID}`,
    );
    expect(redisCache.del).toHaveBeenCalledWith(
      `ticket:seat-map:${TICKET_UUID}`,
    );
    expect(redisCache.patternDel).not.toHaveBeenCalled();
    expect(redisCache.using).toHaveBeenCalledWith(
      [`lock:ticket:reserve:${TICKET_UUID}:seat:A01`],
      10000,
      { retryCount: 100, retryDelay: 50, retryJitter: 0 },
      expect.any(Function),
    );
    expect(result.availableSeatLabels).toEqual(['A02']);
    expect(result.stockAvailable).toBe(1);
  });

  it('should reject non-UUID ticket ids before touching the database', async () => {
    await expect(
      service.reserveSeat('not-a-uuid', ITEM_UUID, { seatLabel: 'A01' }),
    ).rejects.toMatchObject({
      message: 'Ticket not-a-uuid was not found',
      status: HttpStatus.NOT_FOUND,
    });

    expect(dbMock.transaction).not.toHaveBeenCalled();
    expect(dbMock.query.tickets.findFirst).not.toHaveBeenCalled();
  });

  it('should reject releasing aggregate stock beyond the initial amount', async () => {
    dbMock.query.tickets.findFirst.mockResolvedValue(
      buildTicket({
        ticketItems: [
          buildTicketItem({
            stockInitial: 2,
            stockAvailable: 2,
            availableSeatLabels: [],
          }),
        ],
      }),
    );

    await expect(
      service.release(TICKET_UUID, {
        ticketItemId: ITEM_UUID,
        quantity: 1,
      }),
    ).rejects.toMatchObject({
      message: 'Release quantity exceeds initial stock',
      status: HttpStatus.CONFLICT,
    });

    expect(dbMock.ticketItemUpdateSetSpy).not.toHaveBeenCalled();
  });

  it('should fail-fast (throw 503) if lock acquisition fails during cache miss', async () => {
    redisCache.get.mockResolvedValue(null);
    redisCache.acquireLock.mockResolvedValue(null); // Lock acquisition fails

    await expect(service.findOne(TICKET_UUID)).rejects.toThrow(
      new HttpException(
        'The system is currently experiencing high load, please try again.',
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
    );
  });

  it('should collapse multiple concurrent queries into a single database fetch', async () => {
    redisCache.get.mockResolvedValue(null);
    redisCache.acquireLock.mockResolvedValue({
      release: jest.fn().mockResolvedValue(undefined),
    });

    const ticket = buildTicket();
    dbMock.query.tickets.findFirst.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(ticket), 100)),
    );

    // Call findOne concurrently multiple times
    const promises = [
      service.findOne(TICKET_UUID),
      service.findOne(TICKET_UUID),
      service.findOne(TICKET_UUID),
    ];

    const results = await Promise.all(promises);

    // Ensure they all returned the same result
    expect(results[0].id).toBe(ticket.id);
    expect(results[1].id).toBe(ticket.id);
    expect(results[2].id).toBe(ticket.id);

    // Database findFirst should only be called once!
    expect(dbMock.query.tickets.findFirst).toHaveBeenCalledTimes(1);
  });

  it('should normalize, persist, update, and search multi-image galleries on tickets and ticket items', async () => {
    const trainImages = [
      'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
    ];
    const coachImages = [
      'https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=1200',
    ];

    dbMock.ticketInsertReturningSpy.mockResolvedValue([
      buildTicket({
        images: trainImages,
        ticketItems: [buildTicketItem({ images: coachImages })],
      }),
    ]);
    redisCache.patternDel.mockResolvedValue(1);

    const created = await service.create({
      title: 'SE1 Express',
      trainNumber: 'SE1',
      images: [
        `  ${trainImages[0]}  `,
        trainImages[1],
        trainImages[0], // duplicate should be stripped
      ],
      ticketItems: [
        {
          name: 'VIP Sleeper',
          images: [` ${coachImages[0]} `, coachImages[0]],
          seatLabels: ['A01'],
        },
      ],
    });

    expect(dbMock.ticketInsertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        images: trainImages,
      }),
    );
    expect(dbMock.ticketItemInsertValuesSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        images: coachImages,
      }),
    ]);
    expect(created.images).toEqual(trainImages);
    expect(created.ticketItems[0].images).toEqual(coachImages);

    dbMock.query.tickets.findMany.mockResolvedValue([
      buildTicket({
        status: TicketStatus.Published,
        images: trainImages,
        ticketItems: [buildTicketItem({ images: coachImages })],
      }),
    ]);

    const searchResult = await service.searchTrips({ q: 'SE1' });
    expect(searchResult.data).toHaveLength(1);
    expect(searchResult.data[0].images).toEqual(trainImages);
  });

  it('reserve returns exact allocatedSeatLabels and release does not reopen arbitrary occupied seats', async () => {
    // Ticket item has seats A01 and A02
    // Customer 1 already holds A01
    const seatedItem = buildTicketItem({
      seatLabels: ['A01', 'A02', 'A03'],
      availableSeatLabels: ['A02', 'A03'],
      stockInitial: 3,
      stockAvailable: 2,
    });

    dbMock.query.tickets.findFirst.mockResolvedValue(
      buildTicket({
        status: TicketStatus.Published,
        ticketItems: [seatedItem],
      }),
    );
    redisCache.patternDel.mockResolvedValue(1);

    // Customer 2 reserves 1 seat by quantity
    const reserveResult = await service.reserve(TICKET_UUID, {
      ticketItemId: ITEM_UUID,
      quantity: 1,
    });

    // It must return the exact allocated seat label (A02), not arbitrary
    expect(reserveResult.allocatedSeatLabels).toEqual(['A02']);

    // Now mock state after reservation where A02 was held
    const reservedItem = buildTicketItem({
      seatLabels: ['A01', 'A02', 'A03'],
      availableSeatLabels: ['A03'],
      stockInitial: 3,
      stockAvailable: 1,
    });
    dbMock.query.tickets.findFirst.mockResolvedValue(
      buildTicket({
        status: TicketStatus.Published,
        ticketItems: [reservedItem],
      }),
    );

    // Now release that reservation providing the exact seatLabel
    const releaseResult = await service.release(TICKET_UUID, {
      ticketItemId: ITEM_UUID,
      seatLabel: 'A02',
    });

    // Customer 1's A01 must STILL remain occupied and not be reopened!
    expect(releaseResult.availableSeatLabels).not.toContain('A01');
    expect(releaseResult.availableSeatLabels).toContain('A02');
  });
});
