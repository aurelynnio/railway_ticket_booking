import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  DrizzleService,
  type DrizzleDatabase,
} from '../drizzle/drizzle.service';
import {
  tickets as ticketsTable,
  ticketItems as ticketItemsTable,
  type TicketItem,
} from '../drizzle/schema';
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
} from './dto/ticket.dto';
import { TicketStatus } from './dto/ticket.dto';
import type {
  PaginatedSearchTripResponse,
  SearchTripResponse,
  SearchTripsQuery,
} from './dto/search.dto';
import {
  getMinPrice,
  matchesSeatClass,
  matchesTimeOfDay,
  startOfUtcDay,
  uniqueValues,
} from './utils/search.utils';
import {
  buildTicketItemCreateInput,
  consumeAvailableStock,
  ensureItemCanBeSold,
  ensureJourneyDates,
  ensureSaleDates,
  ensureTicketItemId,
  getActiveItemOrThrow,
  getActiveItems,
  getAvailableStock,
  mergeTicketItem,
  normalizeImages,
  normalizeQuantity,
  normalizeTicketItemStock,
  parseOptionalDate,
  pickBigInt,
  pickNullableString,
  returnStockToPool,
  sortSeatLabels,
  toIsoString,
  toNullableString,
  toTicketItemResponse,
  toTicketItemUpdateData,
  toTicketResponse,
  uniqueLabels,
  type TicketWithItems,
} from './utils/ticket.utils';
import { RedisCacheService } from '../redis/redis.service';

const TICKETS_LIST_CACHE_TTL_SECONDS = 300;
const TICKET_DETAIL_CACHE_TTL_SECONDS = 300;
const TICKET_AVAILABILITY_CACHE_TTL_SECONDS = 15;
const TICKET_SEAT_MAP_CACHE_TTL_SECONDS = 15;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type DrizzleClientLike =
  | DrizzleDatabase
  | Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0];

/**
 * Core business logic and database access layer for tickets.
 * Fully decoupled from caching to respect SRP (Single Responsibility Principle).
 *
 * PostgreSQL persistence model:
 * - `tickets` and `ticket_items` live in separate tables (1:N relation).
 * - All read-then-write flows (reserve/release/update stock) run inside a
 *   transaction that first takes a row lock (`SELECT ... FOR UPDATE`) on the
 *   ticket row, serializing concurrent mutations of the same train — this is
 *   the source of truth for correctness, replacing the old Mongo pattern of
 *   optimistic `updatedAt` checks + full embedded-array overwrites.
 */
@Injectable()
export class TicketBaseService {
  constructor(protected readonly drizzle: DrizzleService) {}

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

    const [createdTicket] = await this.drizzle.db
      .insert(ticketsTable)
      .values({
        id: ticketId,
        title: payload.title?.trim() || null,
        trainNumber: payload.trainNumber?.trim() || null,
        departureStationCode: payload.departureStationCode?.trim() || null,
        departureStationName: payload.departureStationName?.trim() || null,
        arrivalStationCode: payload.arrivalStationCode?.trim() || null,
        arrivalStationName: payload.arrivalStationName?.trim() || null,
        journeyNote: payload.journeyNote?.trim() || null,
        images: normalizeImages(payload.images),
        dateStart: parseOptionalDate(payload.dateStart, 'dateStart') ?? null,
        dateEnd: parseOptionalDate(payload.dateEnd, 'dateEnd') ?? null,
        status: payload.status ?? TicketStatus.Draft,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (ticketItems.length > 0) {
      await this.drizzle.db.insert(ticketItemsTable).values(ticketItems);
    }

    return toTicketResponse({
      ...createdTicket,
      ticketItems,
    });
  }

  async findAll(query: FindTicketsQuery): Promise<PaginatedTicketResponse> {
    const conditions: SQL[] = [isNull(ticketsTable.deletedAt)];
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (query.departureStationCode) {
      conditions.push(
        eq(ticketsTable.departureStationCode, query.departureStationCode.trim()),
      );
    }
    if (query.arrivalStationCode) {
      conditions.push(
        eq(ticketsTable.arrivalStationCode, query.arrivalStationCode.trim()),
      );
    }
    if (query.status !== undefined && query.status !== '') {
      const status = Number(query.status);
      if (Number.isNaN(status)) {
        throw new HttpException(
          'status must be a number',
          HttpStatus.BAD_REQUEST,
        );
      }
      conditions.push(eq(ticketsTable.status, status));
    }
    if (query.dateStart) {
      // parseOptionalDate only yields null for empty input, which the guard
      // above already excluded — so this is always a real Date (or a 400).
      const start = parseOptionalDate(query.dateStart, 'dateStart') as Date;
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      conditions.push(gte(ticketsTable.dateStart, start));
      conditions.push(lt(ticketsTable.dateStart, end));
    }

    const whereClause = and(...conditions);

    const [[{ total }], tickets] = await Promise.all([
      this.drizzle.db
        .select({ total: count() })
        .from(ticketsTable)
        .where(whereClause),
      this.drizzle.db.query.tickets.findMany({
        where: whereClause,
        orderBy: [asc(ticketsTable.dateStart), desc(ticketsTable.createdAt)],
        with: { ticketItems: true },
        offset: (page - 1) * limit,
        limit,
      }),
    ]);

    return {
      data: tickets.map((ticket) => toTicketResponse(ticket)),
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
    const existing = await this.getTicketOrThrow(ticketId);
    ensureJourneyDates(payload.dateStart, payload.dateEnd);

    const [updated] = await this.drizzle.db
      .update(ticketsTable)
      .set({
        title: toNullableString(payload.title),
        trainNumber: toNullableString(payload.trainNumber),
        departureStationCode: toNullableString(payload.departureStationCode),
        departureStationName: toNullableString(payload.departureStationName),
        arrivalStationCode: toNullableString(payload.arrivalStationCode),
        arrivalStationName: toNullableString(payload.arrivalStationName),
        journeyNote: toNullableString(payload.journeyNote),
        ...(payload.images !== undefined
          ? { images: normalizeImages(payload.images) }
          : {}),
        dateStart: parseOptionalDate(payload.dateStart, 'dateStart'),
        dateEnd: parseOptionalDate(payload.dateEnd, 'dateEnd'),
        status: payload.status,
        updatedAt: new Date(),
      })
      .where(eq(ticketsTable.id, ticketId))
      .returning();

    return toTicketResponse({
      ...updated,
      ticketItems: existing.ticketItems,
    });
  }

  async remove(ticketId: string) {
    await this.getTicketOrThrow(ticketId);

    await this.drizzle.db
      .update(ticketsTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ticketsTable.id, ticketId));

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
      // Delegate to the lock-free core, NOT to this.reserveSeat(): the caching
      // subclass already wraps this call in the per-seat distributed lock, and
      // Redlock is not reentrant, so re-acquiring the same resource here used to
      // retry until it surfaced a spurious 409.
      return this.reserveSeatInternal(ticketId, payload.ticketItemId, {
        seatLabel: payload.seatLabel,
        passengerId: payload.passengerId,
      });
    }

    const quantity = normalizeQuantity(payload.quantity);

    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
        const item = getActiveItemOrThrow(ticket, payload.ticketItemId);

        ensureItemCanBeSold(item);

        // Consumes seats from BOTH counters so the label pool cannot be resold.
        const consumption = consumeAvailableStock(item, quantity);
        const nextItem = normalizeTicketItemStock(
          mergeTicketItem(item, {
            availableSeatLabels: consumption.availableSeatLabels,
            stockAvailable: consumption.stockAvailable,
            updatedAt: new Date(),
          }),
        );

        await this.updateTicketItemRow(tx, nextItem);
        return { nextItem, allocatedSeatLabels: consumption.allocatedSeatLabels };
      },
    );

    return {
      ...toTicketItemResponse(updatedItem.nextItem),
      allocatedSeatLabels: updatedItem.allocatedSeatLabels,
    } as TicketItemResponse & { allocatedSeatLabels: string[] };
  }

  async addTicketItem(
    ticketId: string,
    payload: CreateTicketItemRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const now = new Date();
    const item = buildTicketItemCreateInput(ticket.id, payload, now);

    await this.drizzle.db.insert(ticketItemsTable).values(item);

    const updated = await this.getTicketOrThrow(ticketId);
    return toTicketResponse(updated);
  }

  async updateTicketItem(
    ticketId: string,
    ticketItemId: string,
    payload: UpdateTicketItemRequest,
  ): Promise<TicketItemResponse> {
    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
        const item = getActiveItemOrThrow(ticket, ticketItemId);

        ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

        const mergedItem = mergeTicketItem(item, {
          name: pickNullableString(payload.name, item.name),
          description: pickNullableString(payload.description, item.description),
          coachCode: pickNullableString(payload.coachCode, item.coachCode),
          seatClass: pickNullableString(payload.seatClass, item.seatClass),
          seatType: pickNullableString(payload.seatType, item.seatType),
          images:
            payload.images !== undefined
              ? normalizeImages(payload.images)
              : item.images,
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

        const nextItem = normalizeTicketItemStock(mergedItem);
        await this.updateTicketItemRow(tx, nextItem);
        return nextItem;
      },
    );

    return toTicketItemResponse(updatedItem);
  }

  async removeTicketItem(ticketId: string, ticketItemId: string) {
    await this.withTicketRowLock(ticketId, async (tx) => {
      const ticket = await this.getTicketOrThrow(ticketId, tx);
      const item = getActiveItemOrThrow(ticket, ticketItemId);

      await this.updateTicketItemRow(
        tx,
        mergeTicketItem(item, {
          deletedAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    });

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
      // Same reasoning as reserve(): the caller already holds the per-seat lock.
      return this.releaseSeatInternal(ticketId, payload.ticketItemId, {
        seatLabel: payload.seatLabel,
        passengerId: payload.passengerId,
      });
    }

    const seatLabelsToRelease = payload.seatLabels ?? [];
    if (seatLabelsToRelease.length > 0) {
      let lastResult: TicketItemResponse | undefined;
      for (const seatLabel of seatLabelsToRelease) {
        lastResult = await this.releaseSeatInternal(
          ticketId,
          payload.ticketItemId,
          {
            seatLabel,
            passengerId: payload.passengerId,
          },
        );
      }
      return lastResult!;
    }

    const quantity = normalizeQuantity(payload.quantity);

    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
        const item = getActiveItemOrThrow(ticket, payload.ticketItemId);

        // Same helper as the count-based path so the two counters stay in sync.
        const nextItem = normalizeTicketItemStock(
          mergeTicketItem(item, {
            ...returnStockToPool(item, quantity, seatLabelsToRelease),
            updatedAt: new Date(),
          }),
        );

        await this.updateTicketItemRow(tx, nextItem);
        return nextItem;
      },
    );

    return toTicketItemResponse(updatedItem);
  }

  async publish(ticketId: string): Promise<TicketResponse> {
    const existing = await this.getTicketOrThrow(ticketId);
    const [updated] = await this.drizzle.db
      .update(ticketsTable)
      .set({
        status: TicketStatus.Published,
        updatedAt: new Date(),
      })
      .where(eq(ticketsTable.id, ticketId))
      .returning();

    return toTicketResponse({
      ...updated,
      ticketItems: existing.ticketItems,
    });
  }

  async unpublish(ticketId: string): Promise<TicketResponse> {
    const existing = await this.getTicketOrThrow(ticketId);
    const [updated] = await this.drizzle.db
      .update(ticketsTable)
      .set({
        status: TicketStatus.Draft,
        updatedAt: new Date(),
      })
      .where(eq(ticketsTable.id, ticketId))
      .returning();

    return toTicketResponse({
      ...updated,
      ticketItems: existing.ticketItems,
    });
  }

  async prepareStock(
    ticketId: string,
    payload: PrepareStockRequest,
  ): Promise<TicketResponse> {
    await this.withTicketRowLock(ticketId, async (tx) => {
      const ticket = await this.getTicketOrThrow(ticketId, tx);
      const targetIds = payload.ticketItemId
        ? new Set([payload.ticketItemId])
        : new Set(getActiveItems(ticket).map((item: TicketItem) => item.id));

      for (const item of ticket.ticketItems) {
        if (!targetIds.has(item.id) || item.deletedAt) {
          continue;
        }

        const seatLabels = payload.availableSeatLabels?.length
          ? uniqueLabels(payload.availableSeatLabels)
          : uniqueLabels(item.seatLabels);
        const stockInitial =
          payload.stockInitial ?? item.stockInitial ?? seatLabels.length;
        const stockAvailable =
          seatLabels.length > 0 ? seatLabels.length : stockInitial;

        await this.updateTicketItemRow(
          tx,
          normalizeTicketItemStock(
            mergeTicketItem(item, {
              seatLabels: seatLabels.length > 0 ? seatLabels : item.seatLabels,
              availableSeatLabels:
                seatLabels.length > 0 ? seatLabels : item.availableSeatLabels,
              stockInitial,
              stockAvailable,
              stockPrepared: true,
              updatedAt: new Date(),
            }),
          ),
        );
      }
    });

    const updated = await this.getTicketOrThrow(ticketId);
    return toTicketResponse(updated);
  }

  async openSale(
    ticketId: string,
    payload: OpenSaleRequest,
  ): Promise<TicketResponse> {
    ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    await this.withTicketRowLock(ticketId, async (tx) => {
      const ticket = await this.getTicketOrThrow(ticketId, tx);
      const targetIds = payload.ticketItemId
        ? new Set([payload.ticketItemId])
        : new Set(getActiveItems(ticket).map((item: TicketItem) => item.id));
      const saleStartTime =
        parseOptionalDate(payload.saleStartTime, 'saleStartTime') ?? new Date();
      const saleEndTime = parseOptionalDate(payload.saleEndTime, 'saleEndTime');

      for (const item of ticket.ticketItems) {
        if (!targetIds.has(item.id) || item.deletedAt) {
          continue;
        }

        await this.updateTicketItemRow(
          tx,
          mergeTicketItem(item, {
            saleStartTime,
            saleEndTime,
            updatedAt: new Date(),
          }),
        );
      }
    });

    const updated = await this.getTicketOrThrow(ticketId);
    return toTicketResponse(updated);
  }

  async closeSale(ticketId: string): Promise<TicketResponse> {
    await this.withTicketRowLock(ticketId, async (tx) => {
      const ticket = await this.getTicketOrThrow(ticketId, tx);
      const now = new Date();

      for (const item of ticket.ticketItems) {
        if (item.deletedAt) {
          continue;
        }

        await this.updateTicketItemRow(
          tx,
          mergeTicketItem(item, {
            saleEndTime: now,
            updatedAt: now,
          }),
        );
      }
    });

    const updated = await this.getTicketOrThrow(ticketId);
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
    return this.reserveSeatInternal(ticketId, ticketItemId, payload);
  }

  /**
   * Lock-free core of seat reservation.
   *
   * Split out so callers that ALREADY hold the per-seat distributed lock (the
   * caching subclass, and `reserve` with a seatLabel) do not try to take the
   * same non-reentrant Redlock resource twice.
   */
  protected async reserveSeatInternal(
    ticketId: string,
    ticketItemId: string,
    payload: ReserveSeatRequest,
  ): Promise<TicketItemResponse> {
    if (!payload.seatLabel?.trim()) {
      throw new HttpException('seatLabel is required', HttpStatus.BAD_REQUEST);
    }

    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
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
          throw new HttpException(
            'Seat is not available',
            HttpStatus.CONFLICT,
          );
        }

        const nextAvailable = item.availableSeatLabels.filter(
          (label: string) => label !== seatLabel,
        );

        // Floor check: a seat label must never be reservable once the pool is
        // exhausted. Without this, `stockAvailable - 1` could go negative when
        // the count-based reserve had already consumed the inventory.
        const available = getAvailableStock(item);
        if (available < 1) {
          throw new HttpException(
            'Not enough stock available',
            HttpStatus.CONFLICT,
          );
        }

        const nextItem = normalizeTicketItemStock(
          mergeTicketItem(item, {
            availableSeatLabels: nextAvailable,
            stockAvailable: available - 1,
            updatedAt: new Date(),
          }),
        );

        await this.updateTicketItemRow(tx, nextItem);
        return nextItem;
      },
    );

    return toTicketItemResponse(updatedItem);
  }

  async releaseSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReleaseSeatRequest,
  ): Promise<TicketItemResponse> {
    return this.releaseSeatInternal(ticketId, ticketItemId, payload);
  }

  /** Lock-free core of seat release — see reserveSeatInternal. */
  protected async releaseSeatInternal(
    ticketId: string,
    ticketItemId: string,
    payload: ReleaseSeatRequest,
  ): Promise<TicketItemResponse> {
    if (!payload.seatLabel?.trim()) {
      throw new HttpException('seatLabel is required', HttpStatus.BAD_REQUEST);
    }

    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
        const item = getActiveItemOrThrow(ticket, ticketItemId);
        const seatLabel = payload.seatLabel.trim();

        if (!item.seatLabels.includes(seatLabel)) {
          throw new HttpException(
            'Seat label does not exist',
            HttpStatus.NOT_FOUND,
          );
        }
        if (item.availableSeatLabels.includes(seatLabel)) {
          throw new HttpException(
            'Seat is already available',
            HttpStatus.CONFLICT,
          );
        }

        const nextAvailable = sortSeatLabels(
          [...item.availableSeatLabels, seatLabel],
          item.seatLabels,
        );

        const nextItem = normalizeTicketItemStock(
          mergeTicketItem(item, {
            availableSeatLabels: nextAvailable,
            stockAvailable: getAvailableStock(item) + 1,
            updatedAt: new Date(),
          }),
        );

        await this.updateTicketItemRow(tx, nextItem);
        return nextItem;
      },
    );

    return toTicketItemResponse(updatedItem);
  }

  async changePrice(
    ticketId: string,
    ticketItemId: string,
    payload: ChangePriceRequest,
  ): Promise<TicketItemResponse> {
    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
        const item = getActiveItemOrThrow(ticket, ticketItemId);

        const nextItem = mergeTicketItem(item, {
          priceOriginal: pickBigInt(payload.priceOriginal, item.priceOriginal),
          priceFlash: pickBigInt(payload.priceFlash, item.priceFlash),
          updatedAt: new Date(),
        });

        await this.updateTicketItemRow(tx, nextItem);
        return nextItem;
      },
    );

    return toTicketItemResponse(updatedItem);
  }

  async changeSaleWindow(
    ticketId: string,
    ticketItemId: string,
    payload: ChangeSaleWindowRequest,
  ): Promise<TicketItemResponse> {
    ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const updatedItem = await this.withTicketRowLock(
      ticketId,
      async (tx) => {
        const ticket = await this.getTicketOrThrow(ticketId, tx);
        const item = getActiveItemOrThrow(ticket, ticketItemId);

        const nextItem = mergeTicketItem(item, {
          saleStartTime: parseOptionalDate(
            payload.saleStartTime,
            'saleStartTime',
          ),
          saleEndTime: parseOptionalDate(payload.saleEndTime, 'saleEndTime'),
          updatedAt: new Date(),
        });

        await this.updateTicketItemRow(tx, nextItem);
        return nextItem;
      },
    );

    return toTicketItemResponse(updatedItem);
  }

  protected async getTicketOrThrow(
    ticketId: string,
    client: DrizzleClientLike = this.drizzle.db,
  ): Promise<TicketWithItems> {
    if (!ticketId.trim()) {
      throw new HttpException('ticketId is required', HttpStatus.BAD_REQUEST);
    }

    const ticket = await client.query.tickets.findFirst({
      where: and(
        eq(ticketsTable.id, ticketId),
        isNull(ticketsTable.deletedAt),
      ),
      with: { ticketItems: true },
    });

    if (!ticket) {
      throw new HttpException(
        `Ticket ${ticketId} was not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return ticket;
  }

  /**
   * Runs `fn` inside a transaction that first locks the ticket row
   * (`SELECT ... FOR UPDATE`). All concurrent stock mutations for the same
   * ticket are serialized by PostgreSQL itself, which removes the
   * read-then-write race the old Mongo implementation guarded against with
   * optimistic `updatedAt` checks.
   */
  protected async withTicketRowLock<T>(
    ticketId: string,
    fn: (tx: DrizzleClientLike) => Promise<T>,
  ): Promise<T> {
    if (!isValidUuid(ticketId)) {
      throw new HttpException(
        `Ticket ${ticketId} was not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.drizzle.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM tickets WHERE id = ${ticketId}::uuid FOR UPDATE`,
      );
      return fn(tx);
    });
  }

  /**
   * Persists a computed TicketItem back to its own row with a single UPDATE.
   */
  protected async updateTicketItemRow(
    client: DrizzleClientLike,
    item: TicketItem,
  ): Promise<void> {
    await client
      .update(ticketItemsTable)
      .set(toTicketItemUpdateData(item))
      .where(eq(ticketItemsTable.id, item.id));
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
    drizzle: DrizzleService,
    private readonly redisCaching: RedisCacheService,
  ) {
    super(drizzle);
  }

  async create(payload: CreateTicketRequest): Promise<TicketResponse> {
    const result = await super.create(payload);
    await this.invalidateTicketListCache();
    return result;
  }

  /*
   * =========================================================================
   * Search functionality (previously search-service).
   * Queries the same tickets tables directly — no separate read model or
   * event sync needed, since the data already lives in this service's DB.
   * =========================================================================
   */

  async searchTrips(
    query: SearchTripsQuery,
  ): Promise<PaginatedSearchTripResponse> {
    const conditions: SQL[] = [
      isNull(ticketsTable.deletedAt),
      eq(ticketsTable.status, TicketStatus.Published),
    ];
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (query.date) {
      const start = startOfUtcDay(query.date);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      conditions.push(gte(ticketsTable.dateStart, start));
      conditions.push(lt(ticketsTable.dateStart, end));
    }

    if (query.q?.trim()) {
      const pattern = `%${query.q.trim()}%`;
      conditions.push(
        or(
          ilike(ticketsTable.trainNumber, pattern),
          ilike(ticketsTable.title, pattern),
          ilike(ticketsTable.departureStationName, pattern),
          ilike(ticketsTable.departureStationCode, pattern),
          ilike(ticketsTable.arrivalStationName, pattern),
          ilike(ticketsTable.arrivalStationCode, pattern),
          ilike(ticketsTable.journeyNote, pattern),
        )!,
      );
    }

    if (query.from?.trim()) {
      const from = query.from.trim();
      conditions.push(
        or(
          ilike(ticketsTable.departureStationCode, from),
          ilike(ticketsTable.departureStationName, `%${from}%`),
        )!,
      );
    }

    if (query.to?.trim()) {
      const to = query.to.trim();
      conditions.push(
        or(
          ilike(ticketsTable.arrivalStationCode, to),
          ilike(ticketsTable.arrivalStationName, `%${to}%`),
        )!,
      );
    }

    // Fetch the full matching set, then filter + sort + paginate in memory so
    // ordering (price / departure / recommended) and totals are honest across
    // pages (server-side sort/filter, Direction B locked decision).
    const tickets = await this.drizzle.db.query.tickets.findMany({
      where: and(...conditions),
      orderBy: [asc(ticketsTable.dateStart), desc(ticketsTable.createdAt)],
      with: { ticketItems: true },
    });

    const trips = tickets.map((ticket) => this.toSearchTrip(ticket));

    // Server-side filters (time of day + seat class) — mirror of the former
    // client-side filters, so pagination totals are honest end-to-end.
    const filteredTrips = trips.filter(
      (trip) =>
        matchesTimeOfDay(trip.dateStart, query.timeOfDay) &&
        matchesSeatClass(trip.seatClasses, query.seatClass),
    );

    switch (query.sort ?? 'recommended') {
      case 'price':
        filteredTrips.sort(
          (a, b) =>
            Number(a.minPrice ?? Number.MAX_SAFE_INTEGER) -
            Number(b.minPrice ?? Number.MAX_SAFE_INTEGER),
        );
        break;
      case 'departure':
        filteredTrips.sort((a, b) =>
          (a.dateStart ?? '').localeCompare(b.dateStart ?? ''),
        );
        break;
      case 'recommended':
      default:
        filteredTrips.sort(
          (a, b) => (b.availableSeats ?? 0) - (a.availableSeats ?? 0),
        );
        break;
    }

    return {
      data: filteredTrips.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: filteredTrips.length,
        totalPages:
          filteredTrips.length === 0
            ? 0
            : Math.ceil(filteredTrips.length / limit),
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
      const pattern = `%${trimmed}%`;
      const tickets = await this.drizzle.db
        .select({
          departureStationCode: ticketsTable.departureStationCode,
          departureStationName: ticketsTable.departureStationName,
          arrivalStationCode: ticketsTable.arrivalStationCode,
          arrivalStationName: ticketsTable.arrivalStationName,
        })
        .from(ticketsTable)
        .where(
          and(
            isNull(ticketsTable.deletedAt),
            eq(ticketsTable.status, TicketStatus.Published),
            or(
              ilike(ticketsTable.departureStationCode, pattern),
              ilike(ticketsTable.departureStationName, pattern),
              ilike(ticketsTable.arrivalStationCode, pattern),
              ilike(ticketsTable.arrivalStationName, pattern),
            ),
          ),
        )
        .limit(100);

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

  async searchByName(
    name: string,
    limit = 10,
  ): Promise<SearchTripResponse[]> {
    const trimmed = (name || '').trim();
    const conditions: SQL[] = [
      isNull(ticketsTable.deletedAt),
      eq(ticketsTable.status, TicketStatus.Published),
    ];

    if (trimmed) {
      const pattern = `%${trimmed}%`;
      conditions.push(
        or(
          ilike(ticketsTable.trainNumber, pattern),
          ilike(ticketsTable.title, pattern),
          ilike(ticketsTable.departureStationName, pattern),
          ilike(ticketsTable.departureStationCode, pattern),
          ilike(ticketsTable.arrivalStationName, pattern),
          ilike(ticketsTable.arrivalStationCode, pattern),
          ilike(ticketsTable.journeyNote, pattern),
        )!,
      );
    }

    const tickets = await this.drizzle.db.query.tickets.findMany({
      where: and(...conditions),
      limit: Math.min(Math.max(1, limit), 50),
      orderBy: [asc(ticketsTable.dateStart), desc(ticketsTable.createdAt)],
      with: { ticketItems: true },
    });

    return tickets.map((ticket) => this.toSearchTrip(ticket));
  }

  private toSearchTrip(ticket: TicketWithItems): SearchTripResponse {
    const activeItems = ticket.ticketItems.filter(
      (item: TicketItem) => !item.deletedAt,
    );
    const seatClasses = uniqueValues(activeItems.map((item) => item.seatClass));
    const seatTypes = uniqueValues(activeItems.map((item) => item.seatType));
    const minPrice = getMinPrice(activeItems);
    const availableSeats = activeItems.reduce(
      (total, item) => total + getAvailableStock(item),
      0,
    );
    return {
      ticketId: ticket.id,
      title: ticket.title,
      trainNumber: ticket.trainNumber,
      images: ticket.images ?? [],
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
    await this.invalidateTicketListCache();
    return result;
  }

  async remove(ticketId: string) {
    const result = await super.remove(ticketId);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
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
  ): Promise<TicketItemResponse & { allocatedSeatLabels?: string[] }> {
    const seatLabels = payload.seatLabels ?? (payload.seatLabel ? [payload.seatLabel] : []);
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
    const seatLabels = payload.seatLabel ? [payload.seatLabel] : [];
    try {
      const result = await this.executeWithReservationLock(ticketId, seatLabels, () =>
        super.reserveSeat(ticketId, ticketItemId, payload),
      );
      await this.invalidateTicketCache(ticketId);
      return result;
    } catch (err) {
      // Seat conflicts are HttpExceptions, which MicroserviceExceptionFilter
      // does not log (only unhandled 5xx-class errors), so keep a local
      // breadcrumb for operations.
      this.logger.error(`Error in reserveSeat: ${getErrorMessage(err)}`);
      throw err;
    }
  }

  async release(
    ticketId: string,
    payload: ReleaseTicketRequest,
  ): Promise<TicketItemResponse> {
    const seatLabels = payload.seatLabels ?? (payload.seatLabel ? [payload.seatLabel] : []);
    const result = await this.executeWithReservationLock(ticketId, seatLabels, () =>
      super.release(ticketId, payload),
    );
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async releaseSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReleaseSeatRequest,
  ): Promise<TicketItemResponse> {
    const seatLabels = payload.seatLabel ? [payload.seatLabel] : [];
    const result = await this.executeWithReservationLock(ticketId, seatLabels, () =>
      super.releaseSeat(ticketId, ticketItemId, payload),
    );
    await this.invalidateTicketCache(ticketId);
    return result;
  }

  async addTicketItem(
    ticketId: string,
    payload: CreateTicketItemRequest,
  ): Promise<TicketResponse> {
    const result = await super.addTicketItem(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async updateTicketItem(
    ticketId: string,
    ticketItemId: string,
    payload: UpdateTicketItemRequest,
  ): Promise<TicketItemResponse> {
    const result = await super.updateTicketItem(ticketId, ticketItemId, payload);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async removeTicketItem(ticketId: string, ticketItemId: string) {
    const result = await super.removeTicketItem(ticketId, ticketItemId);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async publish(ticketId: string): Promise<TicketResponse> {
    const result = await super.publish(ticketId);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async unpublish(ticketId: string): Promise<TicketResponse> {
    const result = await super.unpublish(ticketId);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async prepareStock(
    ticketId: string,
    payload: PrepareStockRequest,
  ): Promise<TicketResponse> {
    const result = await super.prepareStock(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async openSale(
    ticketId: string,
    payload: OpenSaleRequest,
  ): Promise<TicketResponse> {
    const result = await super.openSale(ticketId, payload);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
    return result;
  }

  async closeSale(ticketId: string): Promise<TicketResponse> {
    const result = await super.closeSale(ticketId);
    await this.invalidateTicketCache(ticketId);
    await this.invalidateTicketListCache();
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

  /**
   * Redlock wrapper around reservation flows. PostgreSQL row locks
   * (SELECT ... FOR UPDATE inside withTicketRowLock) are the correctness
   * guarantee; this distributed lock adds a second layer that sheds load
   * before requests even reach the database and produces friendly
   * "seat is being held" errors for concurrent seat selections.
   */
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
      // AUTO-EXTENDS the lock for as long as the routine runs.
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
