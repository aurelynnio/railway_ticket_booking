import { randomUUID } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Ticket, TicketItem } from '@prisma/client';
import type {
  ChangePriceRequest,
  ChangeSaleWindowRequest,
  CreateTicketItemRequest,
  CreateTicketRequest,
  FindTicketsQuery,
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

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaClient) {}

  health() {
    return {
      service: 'tickets-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async create(payload: CreateTicketRequest): Promise<TicketResponse> {
    this.ensureJourneyDates(payload.dateStart, payload.dateEnd);

    const ticketId = randomUUID();
    const now = new Date();
    const ticketItems =
      payload.ticketItems?.map((item) =>
        this.buildTicketItemCreateInput(ticketId, item, now),
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
        dateStart: this.parseOptionalDate(payload.dateStart, 'dateStart'),
        dateEnd: this.parseOptionalDate(payload.dateEnd, 'dateEnd'),
        status: payload.status ?? TicketStatus.Draft,
        ticketItems: { set: ticketItems },
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.toTicketResponse(created);
  }

  async findAll(query: FindTicketsQuery): Promise<TicketResponse[]> {
    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
    };

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
      const start = this.parseOptionalDate(query.dateStart, 'dateStart');
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

    const tickets = await this.prisma.ticket.findMany({
      where,
      orderBy: [{ dateStart: 'asc' }, { createdAt: 'desc' }],
    });

    return tickets.map((ticket: Ticket) => this.toTicketResponse(ticket));
  }

  async findOne(ticketId: string): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    return this.toTicketResponse(ticket);
  }

  async update(
    ticketId: string,
    payload: UpdateTicketRequest,
  ): Promise<TicketResponse> {
    await this.getTicketOrThrow(ticketId);
    this.ensureJourneyDates(payload.dateStart, payload.dateEnd);

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        title: this.toNullableString(payload.title),
        trainNumber: this.toNullableString(payload.trainNumber),
        departureStationCode: this.toNullableString(
          payload.departureStationCode,
        ),
        departureStationName: this.toNullableString(
          payload.departureStationName,
        ),
        arrivalStationCode: this.toNullableString(payload.arrivalStationCode),
        arrivalStationName: this.toNullableString(payload.arrivalStationName),
        journeyNote: this.toNullableString(payload.journeyNote),
        dateStart: this.parseOptionalDate(payload.dateStart, 'dateStart'),
        dateEnd: this.parseOptionalDate(payload.dateEnd, 'dateEnd'),
        status: payload.status,
        updatedAt: new Date(),
      },
    });

    return this.toTicketResponse(updated);
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
    const items = this.getActiveItems(ticket).map((item) =>
      this.toTicketItemResponse(item),
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
    this.ensureTicketItemId(payload.ticketItemId);

    if (payload.seatLabel) {
      return this.reserveSeat(ticketId, payload.ticketItemId, {
        seatLabel: payload.seatLabel,
        passengerId: payload.passengerId,
      });
    }

    const quantity = this.normalizeQuantity(payload.quantity);
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = this.getActiveItemOrThrow(ticket, payload.ticketItemId);

    this.ensureItemCanBeSold(item);

    const available = item.stockAvailable ?? item.availableSeatLabels.length;
    if (available < quantity) {
      throw new HttpException(
        'Not enough stock available',
        HttpStatus.CONFLICT,
      );
    }

    const nextStock = available - quantity;
    const updatedItem = this.mergeTicketItem(item, {
      stockAvailable: nextStock,
      updatedAt: new Date(),
    });

    const updated = await this.replaceTicketItem(ticket, updatedItem);
    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, payload.ticketItemId),
    );
  }

  async addTicketItem(
    ticketId: string,
    payload: CreateTicketItemRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const now = new Date();
    const item = this.buildTicketItemCreateInput(ticket.id, payload, now);

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        ticketItems: {
          set: [
            ...ticket.ticketItems.map((entry: TicketItem) =>
              this.toTicketItemSetInput(entry),
            ),
            item,
          ],
        },
        updatedAt: now,
      },
    });

    return this.toTicketResponse(updated);
  }

  async updateTicketItem(
    ticketId: string,
    ticketItemId: string,
    payload: UpdateTicketItemRequest,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = this.getActiveItemOrThrow(ticket, ticketItemId);

    this.ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const updatedItem = this.mergeTicketItem(item, {
      name: this.pickNullableString(payload.name, item.name),
      description: this.pickNullableString(
        payload.description,
        item.description,
      ),
      coachCode: this.pickNullableString(payload.coachCode, item.coachCode),
      seatClass: this.pickNullableString(payload.seatClass, item.seatClass),
      seatType: this.pickNullableString(payload.seatType, item.seatType),
      seatLabels: payload.seatLabels
        ? this.uniqueLabels(payload.seatLabels)
        : item.seatLabels,
      availableSeatLabels: payload.availableSeatLabels
        ? this.uniqueLabels(payload.availableSeatLabels)
        : item.availableSeatLabels,
      stockInitial: payload.stockInitial ?? item.stockInitial,
      stockAvailable: payload.stockAvailable ?? item.stockAvailable,
      stockPrepared: payload.stockPrepared ?? item.stockPrepared,
      priceOriginal: this.pickBigInt(payload.priceOriginal, item.priceOriginal),
      priceFlash: this.pickBigInt(payload.priceFlash, item.priceFlash),
      saleStartTime:
        payload.saleStartTime !== undefined
          ? this.parseOptionalDate(payload.saleStartTime, 'saleStartTime')
          : item.saleStartTime,
      saleEndTime:
        payload.saleEndTime !== undefined
          ? this.parseOptionalDate(payload.saleEndTime, 'saleEndTime')
          : item.saleEndTime,
      deletedAt:
        payload.deletedAt !== undefined
          ? this.parseOptionalDate(payload.deletedAt, 'deletedAt')
          : item.deletedAt,
      updatedAt: new Date(),
    });

    const normalizedItem = this.normalizeTicketItemStock(updatedItem);
    const updated = await this.replaceTicketItem(ticket, normalizedItem);

    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, ticketItemId),
    );
  }

  async removeTicketItem(ticketId: string, ticketItemId: string) {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = this.getActiveItemOrThrow(ticket, ticketItemId);

    await this.replaceTicketItem(
      ticket,
      this.mergeTicketItem(item, {
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
    this.ensureTicketItemId(payload.ticketItemId);

    if (payload.seatLabel) {
      return this.releaseSeat(ticketId, payload.ticketItemId, {
        seatLabel: payload.seatLabel,
        passengerId: payload.passengerId,
      });
    }

    const quantity = this.normalizeQuantity(payload.quantity);
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = this.getActiveItemOrThrow(ticket, payload.ticketItemId);

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
      this.mergeTicketItem(item, {
        stockAvailable: next,
        updatedAt: new Date(),
      }),
    );

    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, payload.ticketItemId),
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

    return this.toTicketResponse(updated);
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

    return this.toTicketResponse(updated);
  }

  async prepareStock(
    ticketId: string,
    payload: PrepareStockRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const targetIds = payload.ticketItemId
      ? new Set([payload.ticketItemId])
      : new Set(this.getActiveItems(ticket).map((item: TicketItem) => item.id));

    const updatedItems = ticket.ticketItems.map((item: TicketItem) => {
      if (!targetIds.has(item.id) || item.deletedAt) {
        return item;
      }

      const seatLabels = payload.availableSeatLabels?.length
        ? this.uniqueLabels(payload.availableSeatLabels)
        : this.uniqueLabels(item.seatLabels);
      const stockInitial =
        payload.stockInitial ?? item.stockInitial ?? seatLabels.length;
      const stockAvailable =
        seatLabels.length > 0 ? seatLabels.length : stockInitial;

      return this.normalizeTicketItemStock(
        this.mergeTicketItem(item, {
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
    return this.toTicketResponse(updated);
  }

  async openSale(
    ticketId: string,
    payload: OpenSaleRequest,
  ): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    this.ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const targetIds = payload.ticketItemId
      ? new Set([payload.ticketItemId])
      : new Set(this.getActiveItems(ticket).map((item: TicketItem) => item.id));
    const saleStartTime =
      this.parseOptionalDate(payload.saleStartTime, 'saleStartTime') ??
      new Date();
    const saleEndTime = this.parseOptionalDate(
      payload.saleEndTime,
      'saleEndTime',
    );

    const updatedItems = ticket.ticketItems.map((item: TicketItem) => {
      if (!targetIds.has(item.id) || item.deletedAt) {
        return item;
      }

      return this.mergeTicketItem(item, {
        saleStartTime,
        saleEndTime,
        updatedAt: new Date(),
      });
    });

    const updated = await this.persistTicketItems(ticketId, updatedItems);
    return this.toTicketResponse(updated);
  }

  async closeSale(ticketId: string): Promise<TicketResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const now = new Date();

    const updatedItems = ticket.ticketItems.map((item: TicketItem) => {
      if (item.deletedAt) {
        return item;
      }

      return this.mergeTicketItem(item, {
        saleEndTime: now,
        updatedAt: now,
      });
    });

    const updated = await this.persistTicketItems(ticketId, updatedItems);
    return this.toTicketResponse(updated);
  }

  async seatMap(ticketId: string) {
    const ticket = await this.getTicketOrThrow(ticketId);

    return {
      ticketId: ticket.id,
      items: this.getActiveItems(ticket).map((item) => ({
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
    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(ticket, ticketItemId),
    );
  }

  async ticketItemAvailability(
    ticketId: string,
    ticketItemId: string,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(ticket, ticketItemId),
    );
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
    const item = this.getActiveItemOrThrow(ticket, ticketItemId);
    this.ensureItemCanBeSold(item);

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
      this.normalizeTicketItemStock(
        this.mergeTicketItem(item, {
          availableSeatLabels: nextAvailable,
          stockAvailable:
            item.stockAvailable !== null && item.stockAvailable !== undefined
              ? item.stockAvailable - 1
              : nextAvailable.length,
          updatedAt: new Date(),
        }),
      ),
    );

    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, ticketItemId),
    );
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
    const item = this.getActiveItemOrThrow(ticket, ticketItemId);
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

    const nextAvailable = this.sortSeatLabels(
      [...item.availableSeatLabels, seatLabel],
      item.seatLabels,
    );

    const updated = await this.replaceTicketItem(
      ticket,
      this.normalizeTicketItemStock(
        this.mergeTicketItem(item, {
          availableSeatLabels: nextAvailable,
          stockAvailable:
            item.stockAvailable !== null && item.stockAvailable !== undefined
              ? item.stockAvailable + 1
              : nextAvailable.length,
          updatedAt: new Date(),
        }),
      ),
    );

    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, ticketItemId),
    );
  }

  async changePrice(
    ticketId: string,
    ticketItemId: string,
    payload: ChangePriceRequest,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = this.getActiveItemOrThrow(ticket, ticketItemId);

    const updated = await this.replaceTicketItem(
      ticket,
      this.mergeTicketItem(item, {
        priceOriginal: this.pickBigInt(
          payload.priceOriginal,
          item.priceOriginal,
        ),
        priceFlash: this.pickBigInt(payload.priceFlash, item.priceFlash),
        updatedAt: new Date(),
      }),
    );

    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, ticketItemId),
    );
  }

  async changeSaleWindow(
    ticketId: string,
    ticketItemId: string,
    payload: ChangeSaleWindowRequest,
  ): Promise<TicketItemResponse> {
    const ticket = await this.getTicketOrThrow(ticketId);
    const item = this.getActiveItemOrThrow(ticket, ticketItemId);
    this.ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const updated = await this.replaceTicketItem(
      ticket,
      this.mergeTicketItem(item, {
        saleStartTime: this.parseOptionalDate(
          payload.saleStartTime,
          'saleStartTime',
        ),
        saleEndTime: this.parseOptionalDate(payload.saleEndTime, 'saleEndTime'),
        updatedAt: new Date(),
      }),
    );

    return this.toTicketItemResponse(
      this.getActiveItemOrThrow(updated, ticketItemId),
    );
  }

  private async getTicketOrThrow(ticketId: string): Promise<Ticket> {
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

  private getActiveItems(ticket: Ticket): TicketItem[] {
    return ticket.ticketItems.filter((item: TicketItem) => !item.deletedAt);
  }

  private getActiveItemOrThrow(
    ticket: Ticket,
    ticketItemId: string,
  ): TicketItem {
    const item = ticket.ticketItems.find(
      (entry: TicketItem) => entry.id === ticketItemId && !entry.deletedAt,
    );

    if (!item) {
      throw new HttpException(
        `Ticket item ${ticketItemId} was not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return item;
  }

  private async replaceTicketItem(ticket: Ticket, updatedItem: TicketItem) {
    const items = ticket.ticketItems.map((item: TicketItem) =>
      item.id === updatedItem.id ? updatedItem : item,
    );

    return this.persistTicketItems(ticket.id, items);
  }

  private async persistTicketItems(ticketId: string, items: TicketItem[]) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ticketItems: {
          set: items.map((item) => this.toTicketItemSetInput(item)),
        },
        updatedAt: new Date(),
      },
    });
  }

  private buildTicketItemCreateInput(
    ticketId: string,
    payload: CreateTicketItemRequest,
    now: Date,
  ): Prisma.TicketItemCreateInput {
    this.ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

    const seatLabels = this.uniqueLabels(payload.seatLabels ?? []);
    const availableSeatLabels = this.uniqueLabels(
      payload.availableSeatLabels ?? seatLabels,
    );
    const stockInitial =
      payload.stockInitial ??
      (seatLabels.length > 0 ? seatLabels.length : null);
    const stockAvailable =
      payload.stockAvailable ??
      (availableSeatLabels.length > 0
        ? availableSeatLabels.length
        : stockInitial);

    return this.normalizeTicketItemStock({
      id: randomUUID(),
      ticketId,
      name: this.toNullableString(payload.name),
      description: this.toNullableString(payload.description),
      coachCode: this.toNullableString(payload.coachCode),
      seatClass: this.toNullableString(payload.seatClass),
      seatType: this.toNullableString(payload.seatType),
      seatLabels,
      availableSeatLabels,
      stockInitial,
      stockAvailable,
      stockPrepared: payload.stockPrepared ?? availableSeatLabels.length > 0,
      priceOriginal: this.toOptionalBigInt(payload.priceOriginal),
      priceFlash: this.toOptionalBigInt(payload.priceFlash),
      saleStartTime: this.parseOptionalDate(
        payload.saleStartTime,
        'saleStartTime',
      ),
      saleEndTime: this.parseOptionalDate(payload.saleEndTime, 'saleEndTime'),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  private toTicketItemSetInput(item: TicketItem): Prisma.TicketItemCreateInput {
    return {
      id: item.id,
      ticketId: item.ticketId,
      name: item.name,
      description: item.description,
      coachCode: item.coachCode,
      seatClass: item.seatClass,
      seatType: item.seatType,
      seatLabels: item.seatLabels,
      availableSeatLabels: item.availableSeatLabels,
      stockInitial: item.stockInitial,
      stockAvailable: item.stockAvailable,
      stockPrepared: item.stockPrepared,
      priceOriginal: item.priceOriginal,
      priceFlash: item.priceFlash,
      saleStartTime: item.saleStartTime,
      saleEndTime: item.saleEndTime,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    };
  }

  private mergeTicketItem(
    item: TicketItem,
    patch: Partial<TicketItem>,
  ): TicketItem {
    return {
      ...item,
      ...patch,
    };
  }

  private normalizeTicketItemStock(
    item: Prisma.TicketItemCreateInput,
  ): Prisma.TicketItemCreateInput;
  private normalizeTicketItemStock(item: TicketItem): TicketItem;
  private normalizeTicketItemStock(
    item: Prisma.TicketItemCreateInput | TicketItem,
  ) {
    const seatLabels = this.uniqueLabels(item.seatLabels ?? []);
    const availableSeatLabels = this.sortSeatLabels(
      this.uniqueLabels(item.availableSeatLabels ?? []),
      seatLabels,
    );
    const stockInitial =
      item.stockInitial ?? (seatLabels.length > 0 ? seatLabels.length : null);
    const stockAvailable =
      item.stockAvailable ??
      (availableSeatLabels.length > 0
        ? availableSeatLabels.length
        : stockInitial);

    return {
      ...item,
      seatLabels,
      availableSeatLabels,
      stockInitial,
      stockAvailable,
    };
  }

  private toTicketResponse(ticket: Ticket): TicketResponse {
    return {
      id: ticket.id,
      title: ticket.title,
      trainNumber: ticket.trainNumber,
      departureStationCode: ticket.departureStationCode,
      departureStationName: ticket.departureStationName,
      arrivalStationCode: ticket.arrivalStationCode,
      arrivalStationName: ticket.arrivalStationName,
      journeyNote: ticket.journeyNote,
      dateStart: this.toIsoString(ticket.dateStart),
      dateEnd: this.toIsoString(ticket.dateEnd),
      status: ticket.status,
      createdAt: this.toIsoString(ticket.createdAt),
      updatedAt: this.toIsoString(ticket.updatedAt),
      deletedAt: this.toIsoString(ticket.deletedAt),
      ticketItems: this.getActiveItems(ticket).map((item: TicketItem) =>
        this.toTicketItemResponse(item),
      ),
    };
  }

  private toTicketItemResponse(item: TicketItem): TicketItemResponse {
    return {
      id: item.id,
      ticketId: item.ticketId,
      name: item.name,
      description: item.description,
      coachCode: item.coachCode,
      seatClass: item.seatClass,
      seatType: item.seatType,
      seatLabels: item.seatLabels,
      availableSeatLabels: item.availableSeatLabels,
      occupiedSeatLabels: item.seatLabels.filter(
        (label: string) => !item.availableSeatLabels.includes(label),
      ),
      stockInitial: item.stockInitial,
      stockAvailable: item.stockAvailable,
      stockPrepared: item.stockPrepared,
      priceOriginal: this.toNumber(item.priceOriginal),
      priceFlash: this.toNumber(item.priceFlash),
      saleStartTime: this.toIsoString(item.saleStartTime),
      saleEndTime: this.toIsoString(item.saleEndTime),
      createdAt: this.toIsoString(item.createdAt),
      updatedAt: this.toIsoString(item.updatedAt),
      deletedAt: this.toIsoString(item.deletedAt),
      saleOpen: this.isSaleOpen(item),
    };
  }

  private ensureJourneyDates(dateStart?: string, dateEnd?: string) {
    const parsedStart = this.parseOptionalDate(dateStart, 'dateStart');
    const parsedEnd = this.parseOptionalDate(dateEnd, 'dateEnd');
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      throw new HttpException(
        'dateStart must be before or equal to dateEnd',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private ensureSaleDates(saleStartTime?: string, saleEndTime?: string) {
    const parsedStart = this.parseOptionalDate(saleStartTime, 'saleStartTime');
    const parsedEnd = this.parseOptionalDate(saleEndTime, 'saleEndTime');
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      throw new HttpException(
        'saleStartTime must be before or equal to saleEndTime',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private ensureItemCanBeSold(item: TicketItem) {
    if (!item.stockPrepared) {
      throw new HttpException(
        'Stock has not been prepared',
        HttpStatus.CONFLICT,
      );
    }
    if (!this.isSaleOpen(item)) {
      throw new HttpException('Sale window is closed', HttpStatus.CONFLICT);
    }
  }

  private ensureTicketItemId(ticketItemId?: string) {
    if (!ticketItemId?.trim()) {
      throw new HttpException(
        'ticketItemId is required',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private isSaleOpen(item: TicketItem) {
    const now = new Date();

    if (item.saleStartTime && now < item.saleStartTime) {
      return false;
    }
    if (item.saleEndTime && now > item.saleEndTime) {
      return false;
    }

    return true;
  }

  private normalizeQuantity(quantity?: number) {
    const normalized = quantity ?? 1;
    if (!Number.isInteger(normalized) || normalized <= 0) {
      throw new HttpException(
        'quantity must be a positive integer',
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalized;
  }

  private uniqueLabels(labels: string[]) {
    return [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
  }

  private sortSeatLabels(labels: string[], seatOrder: string[]) {
    if (seatOrder.length === 0) {
      return this.uniqueLabels(labels);
    }

    return this.uniqueLabels(labels).sort(
      (left, right) => seatOrder.indexOf(left) - seatOrder.indexOf(right),
    );
  }

  private parseOptionalDate(
    value: string | null | undefined,
    fieldName: string,
  ) {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new HttpException(
        `${fieldName} must be a valid ISO date`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return parsed;
  }

  private toNullableString(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private pickNullableString(
    value: string | undefined,
    fallback: string | null,
  ) {
    if (value === undefined) {
      return fallback;
    }

    return this.toNullableString(value);
  }

  private toOptionalBigInt(value: number | string | undefined) {
    if (value === undefined || value === '') {
      return undefined;
    }

    return this.toBigInt(value);
  }

  private pickBigInt(
    value: number | string | undefined,
    fallback: bigint | null,
  ) {
    if (value === undefined || value === '') {
      return fallback;
    }

    return this.toBigInt(value);
  }

  private toBigInt(value: number | string) {
    try {
      return BigInt(value);
    } catch {
      throw new HttpException(
        'Price values must be valid integers',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toIsoString(value: Date | null | undefined) {
    return value ? value.toISOString() : null;
  }

  private toNumber(value: bigint | null | undefined) {
    return value === null || value === undefined ? null : Number(value);
  }
}
