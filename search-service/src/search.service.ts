import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, Ticket, TicketItem } from '@prisma/client';
import {
  PaginatedSearchTripResponse,
  SearchTripResponse,
  SearchTripsQuery,
  TicketSyncItemPayload,
  TicketSyncPayload,
} from './search.dto';
import {
  getAvailableSeats,
  getMinPrice,
  matchesStationQuery,
  startOfUtcDay,
  toIsoString,
  uniqueValues,
} from './utils/search.utils';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaClient) {}

  health() {
    return {
      service: 'search-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async trips(query: SearchTripsQuery): Promise<PaginatedSearchTripResponse> {
    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
      status: 1,
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
      // Case-insensitive matching via mode: 'insensitive' (supported by MongoDB provider)
      const tickets = await this.prisma.ticket.findMany({
        where: {
          deletedAt: null,
          status: 1,
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

  async upsertTicket(data: TicketSyncPayload): Promise<void> {
    // Ghi vào MongoDB (source of truth)
    await this.prisma.ticket.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        title: data.title,
        trainNumber: data.trainNumber,
        departureStationCode: data.departureStationCode,
        departureStationName: data.departureStationName,
        arrivalStationCode: data.arrivalStationCode,
        arrivalStationName: data.arrivalStationName,
        journeyNote: data.journeyNote,
        dateStart: data.dateStart ? new Date(data.dateStart) : null,
        dateEnd: data.dateEnd ? new Date(data.dateEnd) : null,
        status: data.status,
        createdAt: data.createdAt ? new Date(data.createdAt) : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
        deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
        ticketItems:
          data.ticketItems?.map((item) => this.toTicketItem(item)) ?? [],
      },
      update: {
        title: data.title,
        trainNumber: data.trainNumber,
        departureStationCode: data.departureStationCode,
        departureStationName: data.departureStationName,
        arrivalStationCode: data.arrivalStationCode,
        arrivalStationName: data.arrivalStationName,
        journeyNote: data.journeyNote,
        dateStart: data.dateStart ? new Date(data.dateStart) : null,
        dateEnd: data.dateEnd ? new Date(data.dateEnd) : null,
        status: data.status,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
        deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
        ticketItems:
          data.ticketItems?.map((item) => this.toTicketItem(item)) ?? [],
      },
    });
  }

  async deleteTicket(ticketId: string) {
    // Soft-delete trong MongoDB
    await this.prisma.ticket.updateMany({
      where: { id: ticketId },
      data: { deletedAt: new Date() },
    });
  }

  private toTicketItem(item: TicketSyncItemPayload) {
    return {
      id: item.id,
      ticketId: item.ticketId ?? null,
      name: item.name ?? null,
      description: item.description ?? null,
      coachCode: item.coachCode ?? null,
      seatClass: item.seatClass ?? null,
      seatType: item.seatType ?? null,
      seatLabels: item.seatLabels,
      availableSeatLabels: item.availableSeatLabels,
      stockInitial: item.stockInitial ?? null,
      stockAvailable: item.stockAvailable ?? null,
      stockPrepared: item.stockPrepared ?? false,
      priceOriginal: item.priceOriginal ? BigInt(item.priceOriginal) : null,
      priceFlash: item.priceFlash ? BigInt(item.priceFlash) : null,
      saleStartTime: item.saleStartTime ? new Date(item.saleStartTime) : null,
      saleEndTime: item.saleEndTime ? new Date(item.saleEndTime) : null,
      createdAt: item.createdAt ? new Date(item.createdAt) : null,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    };
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
}
