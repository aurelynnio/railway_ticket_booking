import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, Ticket, TicketItem } from '@prisma/client';
import type {
  ChangePriceRequest,
  ChangeSaleWindowRequest,
  CreateTicketItemRequest,
  CreateTicketRequest,
  FindTicketsQuery,
  PaginatedTicketResponse,
  OpenSaleRequest,
  PrepareStockRequest,
  ReleaseSeatRequest,
  ReleaseTicketRequest,
  ReserveSeatRequest,
  ReserveTicketRequest,
  TicketAvailabilityResponse,
  TicketItemResponse,
  TicketResponse,
  UpdateTicketItemRequest,
  UpdateTicketRequest,
} from './ticket.dto';
import { TicketStatus } from './ticket.dto';
import type {
  PaginatedSearchTripResponse,
  SearchTripResponse,
  SearchTripsQuery,
} from './search.dto';
import {
  getAvailableSeats,
  getMinPrice,
  matchesStationQuery,
  startOfUtcDay,
  toIsoString,
  uniqueValues,
} from './utils/search.utils';
import {
  buildTicketItemCreateInput,
  ensureItemCanBeSold,
  ensureJourneyDates,
  ensureSaleDates,
  ensureTicketItemId,
  getActiveItemOrThrow,
  getActiveItems,
  mergeTicketItem,
  normalizeQuantity,
  normalizeTicketItemStock,
  parseOptionalDate,
  pickBigInt,
  pickNullableString,
  sortSeatLabels,
  toNullableString,
  toTicketItemResponse,
  toTicketItemSetInput,
  toTicketResponse,
  uniqueLabels,
} from './utils/ticket.utils';
import { RedisCacheService } from './redis/redis.service';

const TICKETS_LIST_CACHE_TTL_SECONDS = 300;
const TICKET_DETAIL_CACHE_TTL_SECONDS = 300;
const TICKET_AVAILABILITY_CACHE_TTL_SECONDS = 15;
const TICKET_SEAT_MAP_CACHE_TTL_SECONDS = 15;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Core business logic and database access layer for tickets.
 * Fully decoupled from caching to respect SRP (Single Responsibility Principle).
 */
@Injectable()
export class TicketBaseService {
  constructor(
    protected readonly prisma: PrismaClient,
  ) {}

  health() {
    return {
      service: 'tickets-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async create(payload: CreateTicketRequest): Promise<TicketResponse> {
    ensureJourneyDates(payload.dateStart, payload.dateEnd);

    const ticketId = randomUUID();
    const now = new Date();
    const ticketItems =
      payload.ticketItems?.map((item) =>
        buildTicketItemCreateInput(ticketId, item, now),
      ) ?? [];

    const created = await this.prisma.ticket.create({
      data: {
        id: ticketId,
        title: payload.title?.trim() || null,
        trainNumber: payload.trainNumber?.trim() || null,
        departureStationCode: payload.departureStationCode?.trim() || null,
        departureStationName: payload.departureStationName?.trim() || null,
        arrivalStationCode: payload.arrivalStationCode?.trim() || null,
        arrivalStationName: payload.arrivalStationName?.trim() || null,
        journeyNote: payload.journeyNote?.trim() || null,
        dateStart: parseOptionalDate(payload.dateStart, 'dateStart'),
        dateEnd: parseOptionalDate(payload.dateEnd, 'dateEnd'),
        status: payload.status ?? TicketStatus.Draft,
        ticketItems: { set: ticketItems },
        createdAt: now,
        updatedAt: now,
      },
    });

    return toTicketResponse(created);
  }

  async findAll(query: FindTicketsQuery): Promise<PaginatedTicketResponse> {
    const where: Prisma.TicketWhereInput = {
      OR: [
        { deletedAt: null },
        { deletedAt: { isSet: false } },
      ],
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (query.departureStationCode) {
      where.departureStationCode = query.departureStationCode.trim();
    }
    if (query.arrivalStationCode) {
      where.arrivalStationCode = query.arrivalStationCode.trim();
    }
    if (query.status !== undefined && query.status !== '') {
      const status = Number(query.status);
      if (Number.isNaN(status)) {
        throw new HttpException(
          'status must be a number',
          HttpStatus.BAD_REQUEST,
        );
      }
      where.status = status;
    }
    if (query.dateStart) {
      const start = parseOptionalDate(query.dateStart, 'dateStart');
      if (!start) {
        throw new HttpException(
          'dateStart is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.dateStart = {
        gte: start,
        lt: end,
      };
    }

    const [total, tickets] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        orderBy: [{ dateStart: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: tickets.map((ticket: Ticket) => toTicketResponse(ticket)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(ticketId: string): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    return toTicketResponse(ticket);
  }

  async update(
    ticketId: string,
    payload: UpdateTicketRequest,
  ): Promise<TicketResponse> {
    await this.getTicketOrThrow(ticketId);
    ensureJourneyDates(payload.dateStart, payload.dateEnd);

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        title: toNullableString(payload.title),
        trainNumber: toNullableString(payload.trainNumber),
        departureStationCode: toNullableString(payload.departureStationCode),
        departureStationName: toNullableString(payload.departureStationName),
        arrivalStationCode: toNullableString(payload.arrivalStationCode),
        arrivalStationName: toNullableString(payload.arrivalStationName),
        journeyNote: toNullableString(payload.journeyNote),
        dateStart: parseOptionalDate(payload.dateStart, 'dateStart'),
        dateEnd: parseOptionalDate(payload.dateEnd, 'dateEnd'),
        status: payload.status,
        updatedAt: new Date(),
      },
    });

    return toTicketResponse(updated);
  }

  async remove(ticketId: string) {
    await this.getTicketOrThrow(ticketId);

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      message: `Ticket ${ticketId} has been deleted`,
    };
  }

  async availability(ticketId: string): Promise<TicketAvailabilityResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const items = getActiveItems(ticket).map((item) =>
      toTicketItemResponse(item),
    );

    return {
      ticketId: ticket.id,
      status: ticket.status,
      saleOpen: items.some((item) => item.saleOpen),
      items,
    };
  }

  async reserve(
    ticketId: string,
    payload: ReserveTicketRequest,
  ): Promise<TicketItemResponse> {
    ensureTicketItemId(payload.ticketItemId);

    if (payload.seatLabel) {
      return this.reserveSeat(ticketId, payload.ticketItemId, {
        seatLabel: payload.seatLabel,
        passengerId: payload.passengerId,
      });
    }

    const quantity = normalizeQuantity(payload.quantity);
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, payload.ticketItemId);

    ensureItemCanBeSold(item);

    const available = item.stockAvailable ?? item.availableSeatLabels.length;
    if (available < quantity) {
      throw new HttpException(
        'Not enough stock available',
        HttpStatus.CONFLICT,
      );
    }

    const nextStock = available - quantity;
    const updatedItem = mergeTicketItem(item, {
      stockAvailable: nextStock,
      updatedAt: new Date(),
    });

    const updated = await this.replaceTicketItem(ticket, updatedItem);
    return toTicketItemResponse(
      getActiveItemOrThrow(updated, payload.ticketItemId),
    );
  }

  async addTicketItem(
    ticketId: string,
    payload: CreateTicketItemRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const now = new Date();
    const item = buildTicketItemCreateInput(ticket.id, payload, now);

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        ticketItems: {
          set: [
            ...ticket.ticketItems.map((entry: TicketItem) =>
              toTicketItemSetInput(entry),
            ),
            item,
          ],
        },
        updatedAt: now,
      },
    });

    return toTicketResponse(updated);
  }

  async updateTicketItem(
    ticketId: string,
    ticketItemId: string,
    payload: UpdateTicketItemRequest,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, ticketItemId);

    ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const updatedItem = mergeTicketItem(item, {
      name: pickNullableString(payload.name, item.name),
      description: pickNullableString(payload.description, item.description),
      coachCode: pickNullableString(payload.coachCode, item.coachCode),
      seatClass: pickNullableString(payload.seatClass, item.seatClass),
      seatType: pickNullableString(payload.seatType, item.seatType),
      seatLabels: payload.seatLabels
        ? uniqueLabels(payload.seatLabels)
        : item.seatLabels,
      availableSeatLabels: payload.availableSeatLabels
        ? uniqueLabels(payload.availableSeatLabels)
        : item.availableSeatLabels,
      stockInitial: payload.stockInitial ?? item.stockInitial,
      stockAvailable: payload.stockAvailable ?? item.stockAvailable,
      stockPrepared: payload.stockPrepared ?? item.stockPrepared,
      priceOriginal: pickBigInt(payload.priceOriginal, item.priceOriginal),
      priceFlash: pickBigInt(payload.priceFlash, item.priceFlash),
      saleStartTime:
        payload.saleStartTime !== undefined
          ? parseOptionalDate(payload.saleStartTime, 'saleStartTime')
          : item.saleStartTime,
      saleEndTime:
        payload.saleEndTime !== undefined
          ? parseOptionalDate(payload.saleEndTime, 'saleEndTime')
          : item.saleEndTime,
      deletedAt:
        payload.deletedAt !== undefined
          ? parseOptionalDate(payload.deletedAt, 'deletedAt')
          : item.deletedAt,
      updatedAt: new Date(),
    });

    const normalizedItem = normalizeTicketItemStock(updatedItem);
    const updated = await this.replaceTicketItem(ticket, normalizedItem);

    return toTicketItemResponse(getActiveItemOrThrow(updated, ticketItemId));
  }

  async removeTicketItem(ticketId: string, ticketItemId: string) {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, ticketItemId);

    await this.replaceTicketItem(
      ticket,
      mergeTicketItem(item, {
        deletedAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    return {
      message: `Ticket item ${ticketItemId} has been deleted`,
    };
  }

  async release(
    ticketId: string,
    payload: ReleaseTicketRequest,
  ): Promise<TicketItemResponse> {
    ensureTicketItemId(payload.ticketItemId);

    if (payload.seatLabel) {
      return this.releaseSeat(ticketId, payload.ticketItemId, {
        seatLabel: payload.seatLabel,
        passengerId: payload.passengerId,
      });
    }

    const quantity = normalizeQuantity(payload.quantity);
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, payload.ticketItemId);

    const stockInitial = item.stockInitial ?? item.availableSeatLabels.length;
    const current = item.stockAvailable ?? item.availableSeatLabels.length;
    const next = current + quantity;

    if (next > stockInitial) {
      throw new HttpException(
        'Release quantity exceeds initial stock',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.replaceTicketItem(
      ticket,
      mergeTicketItem(item, {
        stockAvailable: next,
        updatedAt: new Date(),
      }),
    );

    return toTicketItemResponse(
      getActiveItemOrThrow(updated, payload.ticketItemId),
    );
  }

  async publish(ticketId: string): Promise<TicketResponse> {
    await this.getTicketOrThrow(ticketId);
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.Published,
        updatedAt: new Date(),
      },
    });

    return toTicketResponse(updated);
  }

  async unpublish(ticketId: string): Promise<TicketResponse> {
    await this.getTicketOrThrow(ticketId);
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.Draft,
        updatedAt: new Date(),
      },
    });

    return toTicketResponse(updated);
  }

  async prepareStock(
    ticketId: string,
    payload: PrepareStockRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const targetIds = payload.ticketItemId
      ? new Set([payload.ticketItemId])
      : new Set(getActiveItems(ticket).map((item: TicketItem) => item.id));

    const updatedItems = ticket.ticketItems.map((item: TicketItem) => {
      if (!targetIds.has(item.id) || item.deletedAt) {
        return item;
      }

      const seatLabels = payload.availableSeatLabels?.length
        ? uniqueLabels(payload.availableSeatLabels)
        : uniqueLabels(item.seatLabels);
      const stockInitial =
        payload.stockInitial ?? item.stockInitial ?? seatLabels.length;
      const stockAvailable =
        seatLabels.length > 0 ? seatLabels.length : stockInitial;

      return normalizeTicketItemStock(
        mergeTicketItem(item, {
          seatLabels: seatLabels.length > 0 ? seatLabels : item.seatLabels,
          availableSeatLabels:
            seatLabels.length > 0 ? seatLabels : item.availableSeatLabels,
          stockInitial,
          stockAvailable,
          stockPrepared: true,
          updatedAt: new Date(),
        }),
      );
    });

    const updated = await this.persistTicketItems(ticketId, updatedItems);
    return toTicketResponse(updated);
  }

  async openSale(
    ticketId: string,
    payload: OpenSaleRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const targetIds = payload.ticketItemId
      ? new Set([payload.ticketItemId])
      : new Set(getActiveItems(ticket).map((item: TicketItem) => item.id));
    const saleStartTime =
      parseOptionalDate(payload.saleStartTime, 'saleStartTime') ?? new Date();
    const saleEndTime = parseOptionalDate(payload.saleEndTime, 'saleEndTime');

    const updatedItems = ticket.ticketItems.map((item: TicketItem) => {
      if (!targetIds.has(item.id) || item.deletedAt) {
        return item;
      }

      return mergeTicketItem(item, {
        saleStartTime,
        saleEndTime,
        updatedAt: new Date(),
      });
    });

    const updated = await this.persistTicketItems(ticketId, updatedItems);
    return toTicketResponse(updated);
  }

  async closeSale(ticketId: string): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const now = new Date();

    const updatedItems = ticket.ticketItems.map((item: TicketItem) => {
      if (item.deletedAt) {
        return item;
      }

      return mergeTicketItem(item, {
        saleEndTime: now,
        updatedAt: now,
      });
    });

    const updated = await this.persistTicketItems(ticketId, updatedItems);
    return toTicketResponse(updated);
  }

  async seatMap(ticketId: string) {
    const ticket = await this.getTicketOrThrow(ticketId);

    return {
      ticketId: ticket.id,
      items: getActiveItems(ticket).map((item) => ({
        ticketItemId: item.id,
        coachCode: item.coachCode,
        seatClass: item.seatClass,
        seatType: item.seatType,
        seatLabels: item.seatLabels,
        availableSeatLabels: item.availableSeatLabels,
        occupiedSeatLabels: item.seatLabels.filter(
          (seat: string) => !item.availableSeatLabels.includes(seat),
        ),
      })),
    };
  }

  async findTicketItem(
    ticketId: string,
    ticketItemId: string,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    return toTicketItemResponse(getActiveItemOrThrow(ticket, ticketItemId));
  }

  async ticketItemAvailability(
    ticketId: string,
    ticketItemId: string,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    return toTicketItemResponse(getActiveItemOrThrow(ticket, ticketItemId));
  }

  async reserveSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReserveSeatRequest,
  ): Promise<TicketItemResponse> {
    if (!payload.seatLabel?.trim()) {
      throw new HttpException('seatLabel is required', HttpStatus.BAD_REQUEST);
    }

    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, ticketItemId);
    ensureItemCanBeSold(item);

    const seatLabel = payload.seatLabel.trim();
    if (!item.seatLabels.includes(seatLabel)) {
      throw new HttpException(
        'Seat label does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!item.availableSeatLabels.includes(seatLabel)) {
      throw new HttpException('Seat is not available', HttpStatus.CONFLICT);
    }

    const nextAvailable = item.availableSeatLabels.filter(
      (label: string) => label !== seatLabel,
    );
    const updated = await this.replaceTicketItem(
      ticket,
      normalizeTicketItemStock(
        mergeTicketItem(item, {
          availableSeatLabels: nextAvailable,
          stockAvailable:
            item.stockAvailable !== null && item.stockAvailable !== undefined
              ? item.stockAvailable - 1
              : nextAvailable.length,
          updatedAt: new Date(),
        }),
      ),
    );

    return toTicketItemResponse(getActiveItemOrThrow(updated, ticketItemId));
  }

  async releaseSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReleaseSeatRequest,
  ): Promise<TicketItemResponse> {
    if (!payload.seatLabel?.trim()) {
      throw new HttpException('seatLabel is required', HttpStatus.BAD_REQUEST);
    }

    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, ticketItemId);
    const seatLabel = payload.seatLabel.trim();

    if (!item.seatLabels.includes(seatLabel)) {
      throw new HttpException(
        'Seat label does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
    if (item.availableSeatLabels.includes(seatLabel)) {
      throw new HttpException('Seat is already available', HttpStatus.CONFLICT);
    }

    const nextAvailable = sortSeatLabels(
      [...item.availableSeatLabels, seatLabel],
      item.seatLabels,
    );

    const updated = await this.replaceTicketItem(
      ticket,
      normalizeTicketItemStock(
        mergeTicketItem(item, {
          availableSeatLabels: nextAvailable,
          stockAvailable:
            item.stockAvailable !== null && item.stockAvailable !== undefined
              ? item.stockAvailable + 1
              : nextAvailable.length,
          updatedAt: new Date(),
        }),
      ),
    );

    return toTicketItemResponse(getActiveItemOrThrow(updated, ticketItemId));
  }

  async changePrice(
    ticketId: string,
    ticketItemId: string,
    payload: ChangePriceRequest,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, ticketItemId);

    const updated = await this.replaceTicketItem(
      ticket,
      mergeTicketItem(item, {
        priceOriginal: pickBigInt(payload.priceOriginal, item.priceOriginal),
        priceFlash: pickBigInt(payload.priceFlash, item.priceFlash),
        updatedAt: new Date(),
      }),
    );

    return toTicketItemResponse(getActiveItemOrThrow(updated, ticketItemId));
  }

  async changeSaleWindow(
    ticketId: string,
    ticketItemId: string,
    payload: ChangeSaleWindowRequest,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = getActiveItemOrThrow(ticket, ticketItemId);
    ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const updated = await this.replaceTicketItem(
      ticket,
      mergeTicketItem(item, {
        saleStartTime: parseOptionalDate(
          payload.saleStartTime,
          'saleStartTime',
        ),
        saleEndTime: parseOptionalDate(payload.saleEndTime, 'saleEndTime'),
        updatedAt: new Date(),
      }),
    );

    return toTicketItemResponse(getActiveItemOrThrow(updated, ticketItemId));
  }

  protected async getTicketOrThrow(ticketId: string): Promise<Ticket> {
    if (!ticketId.trim()) {
      throw new HttpException('ticketId is required', HttpStatus.BAD_REQUEST);
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        OR: [
          { deletedAt: null },
          { deletedAt: { isSet: false } },
        ],
      },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket ${ticketId} was not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return ticket;
  }

  protected async replaceTicketItem(ticket: Ticket, updatedItem: TicketItem) {
    const items = ticket.ticketItems.map((item: TicketItem) =>
      item.id === updatedItem.id ? updatedItem : item,
    );

    return this.persistTicketItems(ticket.id, items, ticket.updatedAt);
  }

  protected async persistTicketItems(
    ticketId: string,
    items: TicketItem[],
    oldUpdatedAt?: Date | null,
  ) {
    const now = new Date();
    const result = await this.prisma.ticket.updateMany({
      where: {
        id: ticketId,
        updatedAt: oldUpdatedAt || undefined,
      },
      data: {
        ticketItems: {
          set: items.map((item) => toTicketItemSetInput(item)),
        },
        updatedAt: now,
      },
    });

    if (result.count === 0) {
      throw new HttpException(
        'Ticket was updated by another transaction. Please try again.',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!updated) {
      throw new HttpException(
        `Ticket ${ticketId} was not found after update`,
        HttpStatus.NOT_FOUND,
      );
    }

    return updated;
  }
}

/**
 * Decorator-like extension of TicketBaseService that handles caching.
 * Keeps business logic clean of cache concerns (SRP).
 */
@Injectable()
export class TicketService extends TicketBaseService {
  private readonly logger = new Logger(TicketService.name);
  private readonly pendingFetches = new Map<string, Promise<unknown>>();

  constructor(
    prisma: PrismaClient,
    private readonly redisCaching: RedisCacheService,
  ) {
    super(prisma);
  }

  async create(payload: CreateTicketRequest): Promise<TicketResponse> {
    const result = await super.create(payload);
    await this.invalidateTicketListCache();
    return result;
  }

  /*
   * =========================================================================
   * Search functionality (previously search-service).
   * Queries the same Ticket collection directly — no separate read model or
   * event sync needed, since the data already lives in this service's DB.
   * =========================================================================
   */

  async searchTrips(
    query: SearchTripsQuery,
  ): Promise<PaginatedSearchTripResponse> {
    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
      status: TicketStatus.Published,
    };
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (query.date) {
      const start = startOfUtcDay(query.date);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.dateStart = {
        gte: start,
        lt: end,
      };
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      orderBy: [{ dateStart: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });

    const matchedTrips = tickets
      .filter((ticket) => this.matchesRoute(ticket, query))
      .map((ticket) => this.toSearchTrip(ticket));
    const total = matchedTrips.length;
    const startIndex = (page - 1) * limit;

    return {
      data: matchedTrips.slice(startIndex, startIndex + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async suggestStations(
    query: string,
  ): Promise<{ code: string; name: string }[]> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return [];
    }

    try {
      const tickets = await this.prisma.ticket.findMany({
        where: {
          deletedAt: null,
          status: TicketStatus.Published,
          OR: [
            { departureStationCode: { contains: trimmed, mode: 'insensitive' } },
            { departureStationName: { contains: trimmed, mode: 'insensitive' } },
            { arrivalStationCode: { contains: trimmed, mode: 'insensitive' } },
            { arrivalStationName: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
        select: {
          departureStationCode: true,
          departureStationName: true,
          arrivalStationCode: true,
          arrivalStationName: true,
        },
        take: 100,
      });

      const stationsMap = new Map<string, string>();
      for (const ticket of tickets) {
        if (ticket.departureStationCode && ticket.departureStationName) {
          stationsMap.set(
            ticket.departureStationCode.toUpperCase(),
            ticket.departureStationName,
          );
        }
        if (ticket.arrivalStationCode && ticket.arrivalStationName) {
          stationsMap.set(
            ticket.arrivalStationCode.toUpperCase(),
            ticket.arrivalStationName,
          );
        }
      }

      return Array.from(stationsMap.entries()).map(([code, name]) => ({
        code,
        name,
      }));
    } catch (error) {
      this.logger.error(
        `Error suggesting stations for query "${query}":`,
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  private matchesRoute(ticket: Ticket, query: SearchTripsQuery) {
    const fromMatched = matchesStationQuery(
      query.from,
      ticket.departureStationCode,
      ticket.departureStationName,
    );
    const toMatched = matchesStationQuery(
      query.to,
      ticket.arrivalStationCode,
      ticket.arrivalStationName,
    );

    return fromMatched && toMatched;
  }

  private toSearchTrip(ticket: Ticket): SearchTripResponse {
    const activeItems = ticket.ticketItems.filter(
      (item: TicketItem) => !item.deletedAt,
    );
    const seatClasses = uniqueValues(activeItems.map((item) => item.seatClass));
    const seatTypes = uniqueValues(activeItems.map((item) => item.seatType));
    const minPrice = getMinPrice(activeItems);
    const availableSeats = activeItems.reduce(
      (total, item) => total + getAvailableSeats(item),
      0,
    );
    return {
      ticketId: ticket.id,
      title: ticket.title,
      trainNumber: ticket.trainNumber,
      from: {
        code: ticket.departureStationCode,
        name: ticket.departureStationName,
      },
      to: {
        code: ticket.arrivalStationCode,
        name: ticket.arrivalStationName,
      },
      dateStart: toIsoString(ticket.dateStart),
      dateEnd: toIsoString(ticket.dateEnd),
      minPrice,
      availableSeats,
      seatClasses,
      seatTypes,
    };
  }

  async findAll(query: FindTicketsQuery): Promise<PaginatedTicketResponse> {
    const key = `tickets:${JSON.stringify(query)}`;
    return this.getCachedOrFetchWithLock(
      key,
      () => super.findAll(query),
      TICKETS_LIST_CACHE_TTL_SECONDS,
    );
  }

  async findOne(ticketId: string): Promise<TicketResponse> {
    const key = `ticket:${ticketId}`;
    return this.getCachedOrFetchWithLock(
      key,
      () => super.findOne(ticketId),
      TICKET_DETAIL_CACHE_TTL_SECONDS,
    );
  }

  async update(
    ticketId: string,
    payload: UpdateTicketRequest,
  ): Promise<TicketResponse> {
    const result = await super.update(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async remove(ticketId: string) {
    const result = await super.remove(ticketId);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async availability(ticketId: string): Promise<TicketAvailabilityResponse> {
    const key = `ticket:availability:${ticketId}`;
    return this.getCachedOrFetchWithLock(
      key,
      () => super.availability(ticketId),
      TICKET_AVAILABILITY_CACHE_TTL_SECONDS,
    );
  }

  async seatMap(ticketId: string) {
    const key = `ticket:seat-map:${ticketId}`;
    return this.getCachedOrFetchWithLock(
      key,
      () => super.seatMap(ticketId),
      TICKET_SEAT_MAP_CACHE_TTL_SECONDS,
    );
  }

  async reserve(
    ticketId: string,
    payload: ReserveTicketRequest,
  ): Promise<TicketItemResponse> {
    const seatLabels = payload.seatLabel ? [payload.seatLabel] : [];
    const result = await this.executeWithReservationLock(ticketId, seatLabels, () =>
      super.reserve(ticketId, payload),
    );
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async reserveSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReserveSeatRequest,
  ): Promise<TicketItemResponse> {
    try {
      const seatLabels = payload.seatLabel ? [payload.seatLabel] : [];
      const result = await this.executeWithReservationLock(ticketId, seatLabels, () =>
        super.reserveSeat(ticketId, ticketItemId, payload),
      );
      await this.invalidateTicketCache(ticketId);
      return result;
    } catch (err) {
      this.logger.error(`Error in reserveSeat: ${getErrorMessage(err)}`);
      throw err;
    }
  }

  async addTicketItem(
    ticketId: string,
    payload: CreateTicketItemRequest,
  ): Promise<TicketResponse> {
    const result = await super.addTicketItem(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async updateTicketItem(
    ticketId: string,
    ticketItemId: string,
    payload: UpdateTicketItemRequest,
  ): Promise<TicketItemResponse> {
    const result = await super.updateTicketItem(ticketId, ticketItemId, payload);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async removeTicketItem(ticketId: string, ticketItemId: string) {
    const result = await super.removeTicketItem(ticketId, ticketItemId);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async publish(ticketId: string): Promise<TicketResponse> {
    const result = await super.publish(ticketId);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async unpublish(ticketId: string): Promise<TicketResponse> {
    const result = await super.unpublish(ticketId);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async prepareStock(
    ticketId: string,
    payload: PrepareStockRequest,
  ): Promise<TicketResponse> {
    const result = await super.prepareStock(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async openSale(
    ticketId: string,
    payload: OpenSaleRequest,
  ): Promise<TicketResponse> {
    const result = await super.openSale(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async closeSale(ticketId: string): Promise<TicketResponse> {
    const result = await super.closeSale(ticketId);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  protected async persistTicketItems(
    ticketId: string,
    items: TicketItem[],
    oldUpdatedAt?: Date | null,
  ) {
    const result = await super.persistTicketItems(ticketId, items, oldUpdatedAt);
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  // Cache helper utilities
  private async getCachedValue<T>(key: string): Promise<T | null> {
    const cached = await this.redisCaching.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  }

  private async setCachedValue<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisCaching.set(key, JSON.stringify(value), ttlSeconds);
  }

  private async invalidateTicketListCache(): Promise<void> {
    await this.redisCaching.patternDel('tickets:*');
  }

  private async invalidateTicketCache(ticketId: string): Promise<void> {
    await Promise.all([
      this.redisCaching.del(`ticket:${ticketId}`),
      this.redisCaching.del(`ticket:availability:${ticketId}`),
      this.redisCaching.del(`ticket:seat-map:${ticketId}`),
    ]);
  }

  private async getCachedOrFetchWithLock<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number,
    lockTtlMs = 5000,
  ): Promise<T> {
    const cached = await this.getCachedValue<T>(cacheKey);
    if (cached) return cached;

    // Check if there is an ongoing fetch for this key (Request Collapsing)
    const pending = this.pendingFetches.get(cacheKey);
    if (pending) {
      return (await pending) as T;
    }

    const fetchPromise = (async () => {
      const lockKey = `lock:${cacheKey}`;
      // Retry up to 10 times, with 50ms delay (approx 500ms total)
      const lock = await this.redisCaching.acquireLock(lockKey, lockTtlMs, 10, 50);

      if (!lock) {
        // Fail-Fast: throw 503 Service Unavailable under heavy cache stampede load
        throw new HttpException(
          'The system is currently experiencing high load, please try again.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      try {
        // Double-check the cache after acquiring the lock
        const doubleCheck = await this.getCachedValue<T>(cacheKey);
        if (doubleCheck) return doubleCheck;

        // Fetch fresh data
        const result = await fetchFn();
        await this.setCachedValue(cacheKey, result, ttlSeconds);
        return result;
      } finally {
        await this.redisCaching.releaseLock(lock).catch((err) => {
          this.logger.error(
            `Failed to release lock for ${lockKey}: ${getErrorMessage(err)}`,
          );
        });
      }
    })();

    this.pendingFetches.set(cacheKey, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.pendingFetches.delete(cacheKey);
    }
  }

  private async executeWithReservationLock<T>(
    ticketId: string,
    seatLabels: string[],
    actionFn: () => Promise<T>,
    lockTtlMs = 10000,
  ): Promise<T> {
    const resources =
      !seatLabels || seatLabels.length === 0
        ? [`lock:ticket:reserve:${ticketId}`]
        : seatLabels.map(
            (seatLabel) => `lock:ticket:reserve:${ticketId}:seat:${seatLabel}`,
          );

    try {
      // redlock.using acquires all resources atomically (no deadlocks) and
      // AUTO-EXTENDS the lock for as long as the routine runs, so the lock can
      // no longer expire mid-operation on long reservations. Optimistic locking
      // (updatedAt check in persistTicketItems) remains the second safety net.
      return await this.redisCaching.using(
        resources,
        lockTtlMs,
        { retryCount: 100, retryDelay: 50, retryJitter: 0 },
        () => actionFn(),
      );
    } catch (error) {
      if (this.isLockAcquisitionError(error)) {
        // Lock acquisition failed after retries — surface a meaningful error.
        if (!seatLabels || seatLabels.length === 0) {
          throw new HttpException(
            'System is busy processing other reservations for this train. Please try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw new HttpException(
          'One or more selected seats are currently being held by another user. Please choose different seats.',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * Detects whether a thrown error means the distributed lock could not be
   * acquired (as opposed to a business error thrown by the routine itself).
   * redlock v5 signals this with ExecutionError/ResourceLockedError or an
   * ExecutionError carrying an `attempts` array.
   */
  private isLockAcquisitionError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const name = error.constructor?.name ?? '';
    if (name === 'ExecutionError' || name === 'ResourceLockedError') {
      return true;
    }
    return (error as { attempts?: unknown }).attempts !== undefined;
  }
}
