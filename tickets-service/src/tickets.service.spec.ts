import 'reflect-metadata';
import { HttpStatus } from '@nestjs/common';
import type { PrismaClient, Ticket, TicketItem } from '@prisma/client';
import { RedisCacheService } from './redis/redis.service';
import { TicketStatus } from './ticket.dto';
import { TicketsService } from './tickets.service';

jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: {
    ticket: {
      create: jest.Mock;
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let redisCache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    patternDel: jest.Mock;
    acquireLock: jest.Mock;
    releaseLock: jest.Mock;
  };
  let searchClient: {
    emit: jest.Mock;
  };

  const buildTicketItem = (
    overrides: Partial<TicketItem> = {},
  ): TicketItem => ({
    id: 'ticket-item-1',
    ticketId: 'ticket-1',
    name: 'Khoang 1',
    description: 'Ghe mem dieu hoa',
    coachCode: 'A1',
    seatClass: 'soft-seat',
    seatType: 'window',
    seatLabels: ['A01', 'A02'],
    availableSeatLabels: ['A01', 'A02'],
    stockInitial: 2,
    stockAvailable: 2,
    stockPrepared: true,
    priceOriginal: BigInt(150000),
    priceFlash: BigInt(99000),
    saleStartTime: new Date('2026-06-01T00:00:00.000Z'),
    saleEndTime: new Date('2026-07-01T00:00:00.000Z'),
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  });

  const buildTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
    id: 'ticket-1',
    title: 'Tau Sai Gon - Nha Trang',
    trainNumber: 'SE1',
    departureStationCode: 'SG',
    departureStationName: 'Sai Gon',
    arrivalStationCode: 'NT',
    arrivalStationName: 'Nha Trang',
    journeyNote: 'Dem',
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
    prisma = {
      ticket: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

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
    };

    searchClient = {
      emit: jest.fn(),
    };

    service = new TicketsService(
      prisma as unknown as PrismaClient,
      redisCache as unknown as RedisCacheService,
      searchClient as unknown as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a ticket, normalize fields, and invalidate list cache', async () => {
    const created = buildTicket();
    prisma.ticket.create.mockResolvedValue(created);
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

    expect(prisma.ticket.create).toHaveBeenCalledTimes(1);
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Tau Sai Gon - Nha Trang',
          trainNumber: 'SE1',
          departureStationCode: 'SG',
          arrivalStationCode: 'NT',
          journeyNote: 'Dem',
          status: TicketStatus.Draft,
          ticketItems: {
            set: [
              expect.objectContaining({
                ticketId: expect.any(String),
                seatLabels: ['A01', 'A02'],
                availableSeatLabels: ['A01', 'A02'],
                stockInitial: 2,
                stockAvailable: 2,
                stockPrepared: true,
              }),
            ],
          },
        }),
      }),
    );
    expect(redisCache.patternDel).toHaveBeenCalledWith('tickets:*');
    expect(result.id).toBe(created.id);
    expect(result.ticketItems).toHaveLength(1);
  });

  it('should return cached paginated tickets without hitting prisma', async () => {
    const cached = {
      data: [
        {
          id: 'ticket-1',
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
    expect(prisma.ticket.count).not.toHaveBeenCalled();
    expect(prisma.ticket.findMany).not.toHaveBeenCalled();
    expect(result).toEqual(cached);
  });

  it('should query prisma and cache the paginated result on list cache miss', async () => {
    const ticket = buildTicket();
    redisCache.get.mockResolvedValue(null);
    redisCache.set.mockResolvedValue('OK');
    prisma.ticket.count.mockResolvedValue(1);
    prisma.ticket.findMany.mockResolvedValue([ticket]);

    const result = await service.findAll({
      departureStationCode: ' SG ',
      arrivalStationCode: 'NT',
      status: `${TicketStatus.Draft}`,
      dateStart: '2026-06-20T10:00:00.000Z',
      page: 2,
      limit: 5,
    });

    expect(prisma.ticket.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        departureStationCode: 'SG',
        arrivalStationCode: 'NT',
        status: TicketStatus.Draft,
        dateStart: {
          gte: new Date('2026-06-20T10:00:00.000Z'),
          lt: new Date('2026-06-21T10:00:00.000Z'),
        },
      },
    });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        departureStationCode: 'SG',
        arrivalStationCode: 'NT',
        status: TicketStatus.Draft,
        dateStart: {
          gte: new Date('2026-06-20T10:00:00.000Z'),
          lt: new Date('2026-06-21T10:00:00.000Z'),
        },
      },
      orderBy: [{ dateStart: 'asc' }, { createdAt: 'desc' }],
      skip: 5,
      take: 5,
    });
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

  it('should reserve a seat and invalidate derived caches', async () => {
    const ticket = buildTicket();
    const updated = buildTicket({
      ticketItems: [
        buildTicketItem({
          availableSeatLabels: ['A02'],
          stockAvailable: 1,
        }),
      ],
    });
    prisma.ticket.findFirst.mockResolvedValue(ticket);
    prisma.ticket.updateMany.mockResolvedValue({ count: 1 });
    prisma.ticket.findUnique.mockResolvedValue(updated);
    redisCache.del.mockResolvedValue(1);
    redisCache.patternDel.mockResolvedValue(1);

    const result = await service.reserveSeat('ticket-1', 'ticket-item-1', {
      seatLabel: 'A01',
    });

    expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket-1', updatedAt: ticket.updatedAt },
      data: {
        ticketItems: {
          set: [
            expect.objectContaining({
              id: 'ticket-item-1',
              availableSeatLabels: ['A02'],
              stockAvailable: 1,
            }),
          ],
        },
        updatedAt: expect.any(Date),
      },
    });
    expect(redisCache.del).toHaveBeenCalledWith('ticket:ticket-1');
    expect(redisCache.del).toHaveBeenCalledWith('ticket:availability:ticket-1');
    expect(redisCache.del).toHaveBeenCalledWith('ticket:seat-map:ticket-1');
    expect(redisCache.patternDel).toHaveBeenCalledWith('tickets:*');
    expect(result.availableSeatLabels).toEqual(['A02']);
    expect(result.stockAvailable).toBe(1);
  });

  it('should reject releasing aggregate stock beyond the initial amount', async () => {
    prisma.ticket.findFirst.mockResolvedValue(
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
      service.release('ticket-1', {
        ticketItemId: 'ticket-item-1',
        quantity: 1,
      }),
    ).rejects.toMatchObject({
      message: 'Release quantity exceeds initial stock',
      status: HttpStatus.CONFLICT,
    });

    expect(prisma.ticket.updateMany).not.toHaveBeenCalled();
  });
});
