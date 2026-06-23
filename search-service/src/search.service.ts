import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, Ticket, TicketItem } from '@prisma/client';
import {
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
import { ElasticsearchIndexService } from './elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly esService: ElasticsearchIndexService,
  ) {}

  health() {
    return {
      service: 'search-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async trips(query: SearchTripsQuery): Promise<PaginatedSearchTripResponse> {
    try {
      return await this.esService.searchTrips(query);
    } catch (error) {
      this.logger.warn(
        'Elasticsearch query failed, falling back to MongoDB',
        error instanceof Error ? error.message : error,
      );
      return this.tripsFallback(query);
    }
  }

  async suggestStations(query: string) {
    try {
      return await this.esService.suggestStations(query);
    } catch (error) {
      this.logger.warn(
        'Elasticsearch suggest failed',
        error instanceof Error ? error.message : error,
      );
      return [];
    }
  }

  async upsertTicket(data: any) {
    // Write to MongoDB (source of truth)
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
        ticketItems: data.ticketItems ? data.ticketItems.map((item: any) => ({
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
          priceOriginal: item.priceOriginal ? BigInt(item.priceOriginal) : null,
          priceFlash: item.priceFlash ? BigInt(item.priceFlash) : null,
          saleStartTime: item.saleStartTime ? new Date(item.saleStartTime) : null,
          saleEndTime: item.saleEndTime ? new Date(item.saleEndTime) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
          deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        })) : [],
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
        ticketItems: data.ticketItems ? data.ticketItems.map((item: any) => ({
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
          priceOriginal: item.priceOriginal ? BigInt(item.priceOriginal) : null,
          priceFlash: item.priceFlash ? BigInt(item.priceFlash) : null,
          saleStartTime: item.saleStartTime ? new Date(item.saleStartTime) : null,
          saleEndTime: item.saleEndTime ? new Date(item.saleEndTime) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : null,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
          deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        })) : [],
      }
    });

    // Also index into Elasticsearch
    try {
      await this.esService.indexTicket(data);
    } catch (error) {
      this.logger.error(
        `Failed to index ticket ${data.id} to Elasticsearch`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async deleteTicket(ticketId: string) {
    // Soft-delete in MongoDB
    await this.prisma.ticket.updateMany({
      where: { id: ticketId },
      data: { deletedAt: new Date() },
    });

    // Also soft-delete in Elasticsearch
    try {
      await this.esService.deleteTicket(ticketId);
    } catch (error) {
      this.logger.error(
        `Failed to delete ticket ${ticketId} from Elasticsearch`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async syncAllToElasticsearch() {
    this.logger.log('Starting full sync from MongoDB to Elasticsearch...');
    const tickets = await this.prisma.ticket.findMany({
      where: { deletedAt: null, status: 1 },
    });
    const result = await this.esService.bulkIndex(tickets);
    this.logger.log(
      `Sync complete: ${result.indexed} indexed, ${result.errors} errors`,
    );
    return result;
  }

  // Fallback: exact copy of the original Prisma-based search logic
  private async tripsFallback(query: SearchTripsQuery): Promise<PaginatedSearchTripResponse> {
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
