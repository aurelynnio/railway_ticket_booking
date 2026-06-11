import { Injectable } from '@nestjs/common';
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

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaClient) {}

  health() {
    return {
      service: 'search-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /*
   * Search narrows the Prisma read set by day first, then applies route
   * matching in memory because departure and arrival checks are domain-specific.
   */
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
    /*
     * Collapse active ticket items into one trip-facing summary so the client
     * can render price and seat availability without item-level joins.
     */
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
