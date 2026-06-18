import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

/**
 * Core business logic and database access layer for tickets.
 * Fully decoupled from caching to respect SRP (Single Responsibility Principle).
 */
@Injectable()
export class TicketsBaseService {
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
      deletedAt: null,
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
        deletedAt: null,
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
 * Decorator-like extension of TicketsBaseService that handles caching.
 * Keeps business logic clean of cache concerns (SRP).
 */
@Injectable()
export class TicketsService extends TicketsBaseService {
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

  async findAll(query: FindTicketsQuery): Promise<PaginatedTicketResponse> {
    const key = `tickets:${JSON.stringify(query)}`;
    const cached = await this.getCachedValue<PaginatedTicketResponse>(key);
    if (cached) return cached;

    const result = await super.findAll(query);
    await this.setCachedValue(key, result, TICKETS_LIST_CACHE_TTL_SECONDS);
    return result;
  }

  async findOne(ticketId: string): Promise<TicketResponse> {
    const key = `ticket:${ticketId}`;
    const cached = await this.getCachedValue<TicketResponse>(key);
    if (cached) return cached;

    const result = await super.findOne(ticketId);
    await this.setCachedValue(key, result, TICKET_DETAIL_CACHE_TTL_SECONDS);
    return result;
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
    const cached = await this.getCachedValue<TicketAvailabilityResponse>(key);
    if (cached) return cached;

    const result = await super.availability(ticketId);
    await this.setCachedValue(key, result, TICKET_AVAILABILITY_CACHE_TTL_SECONDS);
    return result;
  }

  async seatMap(ticketId: string) {
    const key = `ticket:seat-map:${ticketId}`;
    const cached = await this.getCachedValue<any>(key);
    if (cached) return cached;

    const result = await super.seatMap(ticketId);
    await this.setCachedValue(key, result, TICKET_SEAT_MAP_CACHE_TTL_SECONDS);
    return result;
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
      this.invalidateTicketListCache(),
    ]);
  }
}
