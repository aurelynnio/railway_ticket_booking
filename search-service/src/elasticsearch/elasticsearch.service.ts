import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  PaginatedSearchTripResponse,
  SearchTripResponse,
  SearchTripsQuery,
} from '../search.dto';

function isSaleOpen(item: any): boolean {
  const now = new Date();
  if (item.saleStartTime && now < new Date(item.saleStartTime)) {
    return false;
  }
  if (item.saleEndTime && now > new Date(item.saleEndTime)) {
    return false;
  }
  return true;
}

function getDisplayPrice(item: any): number | null {
  const flashPrice = item.priceFlash !== null && item.priceFlash !== undefined ? Number(item.priceFlash) : null;
  const originalPrice = item.priceOriginal !== null && item.priceOriginal !== undefined ? Number(item.priceOriginal) : null;

  if (flashPrice !== null && isSaleOpen(item)) {
    return flashPrice;
  }
  return originalPrice;
}

function getMinPrice(items: any[]): number | null {
  const prices = items
    .map((item) => getDisplayPrice(item))
    .filter((value): value is number => value !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
}

function getAvailableSeats(item: any): number {
  if (item.stockAvailable !== null && item.stockAvailable !== undefined) {
    return item.stockAvailable;
  }
  return Array.isArray(item.availableSeatLabels) ? item.availableSeatLabels.length : 0;
}

function uniqueValues(values: Array<string | null>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

function startOfUtcDay(value: string) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

@Injectable()
export class ElasticsearchIndexService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchIndexService.name);
  private readonly index = 'tickets';

  constructor(private readonly esService: ElasticsearchService) {}

  async onModuleInit() {
    try {
      const exists = await this.esService.indices.exists({ index: this.index });
      if (!exists) {
        await this.esService.indices.create({
          index: this.index,
          body: {
            mappings: {
              properties: {
                title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                trainNumber: { type: 'keyword' },
                departureStationCode: { type: 'keyword' },
                departureStationName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                arrivalStationCode: { type: 'keyword' },
                arrivalStationName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                journeyNote: { type: 'text' },
                dateStart: { type: 'date' },
                dateEnd: { type: 'date' },
                status: { type: 'integer' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                deletedAt: { type: 'date' },
                ticketItems: {
                  type: 'nested',
                  properties: {
                    id: { type: 'keyword' },
                    ticketId: { type: 'keyword' },
                    name: { type: 'text' },
                    description: { type: 'text' },
                    coachCode: { type: 'keyword' },
                    seatClass: { type: 'keyword' },
                    seatType: { type: 'keyword' },
                    seatLabels: { type: 'keyword' },
                    availableSeatLabels: { type: 'keyword' },
                    stockInitial: { type: 'integer' },
                    stockAvailable: { type: 'integer' },
                    stockPrepared: { type: 'boolean' },
                    priceOriginal: { type: 'long' },
                    priceFlash: { type: 'long' },
                    saleStartTime: { type: 'date' },
                    saleEndTime: { type: 'date' },
                    createdAt: { type: 'date' },
                    updatedAt: { type: 'date' },
                    deletedAt: { type: 'date' },
                  },
                },
              },
            },
          },
        });
        this.logger.log(`Created index "${this.index}" successfully`);
      } else {
        this.logger.log(`Index "${this.index}" already exists`);
      }
    } catch (error) {
      this.logger.error(`Error checking/creating index "${this.index}":`, error);
    }
  }

  async indexTicket(data: any): Promise<void> {
    try {
      const sanitized = {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : null,
        deletedAt: data.deletedAt ? new Date(data.deletedAt).toISOString() : null,
        dateStart: data.dateStart ? new Date(data.dateStart).toISOString() : null,
        dateEnd: data.dateEnd ? new Date(data.dateEnd).toISOString() : null,
        ticketItems: data.ticketItems
          ? data.ticketItems.map((item: any) => ({
              ...item,
              priceOriginal: item.priceOriginal ? Number(item.priceOriginal) : null,
              priceFlash: item.priceFlash ? Number(item.priceFlash) : null,
              saleStartTime: item.saleStartTime ? new Date(item.saleStartTime).toISOString() : null,
              saleEndTime: item.saleEndTime ? new Date(item.saleEndTime).toISOString() : null,
              createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
              updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
              deletedAt: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
            }))
          : [],
      };
      await this.esService.index({
        index: this.index,
        id: data.id,
        document: sanitized,
      });
    } catch (error) {
      this.logger.error(`Error indexing ticket ${data.id}:`, error);
      throw error;
    }
  }

  async deleteTicket(ticketId: string): Promise<void> {
    try {
      await this.esService.update({
        index: this.index,
        id: ticketId,
        doc: {
          deletedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      if (error && (error.status === 404 || (error.meta && error.meta.statusCode === 404))) {
        this.logger.warn(`Ticket ${ticketId} not found in Elasticsearch for deletion`);
        return;
      }
      this.logger.error(`Error deleting ticket ${ticketId} from Elasticsearch:`, error);
    }
  }

  async searchTrips(query: SearchTripsQuery): Promise<PaginatedSearchTripResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const from = (page - 1) * limit;

    const filter: any[] = [
      { term: { status: 1 } },
      { bool: { must_not: { exists: { field: 'deletedAt' } } } },
    ];

    const must: any[] = [];

    if (query.date) {
      const start = startOfUtcDay(query.date);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.push({
        range: {
          dateStart: {
            gte: start.toISOString(),
            lt: end.toISOString(),
          },
        },
      });
    }

    if (query.from) {
      const fromStr = query.from.trim();
      must.push({
        bool: {
          should: [
            { term: { departureStationCode: { value: fromStr.toUpperCase(), boost: 5 } } },
            { match: { departureStationName: { query: fromStr, fuzziness: 'AUTO' } } },
          ],
          minimum_should_match: 1,
        },
      });
    }

    if (query.to) {
      const toStr = query.to.trim();
      must.push({
        bool: {
          should: [
            { term: { arrivalStationCode: { value: toStr.toUpperCase(), boost: 5 } } },
            { match: { arrivalStationName: { query: toStr, fuzziness: 'AUTO' } } },
          ],
          minimum_should_match: 1,
        },
      });
    }

    const res = await this.esService.search({
      index: this.index,
      from,
      size: limit,
      query: {
        bool: {
          filter,
          must,
        },
      },
      sort: [
        { dateStart: 'asc' },
        { _score: { order: 'desc' } },
      ] as any,
    });

    const hits = res.hits?.hits || [];
    const totalValue = typeof res.hits?.total === 'object' && res.hits?.total !== null
      ? (res.hits.total as any).value
      : (res.hits?.total || 0);

    const data: SearchTripResponse[] = hits.map((hit) => {
      const ticket = hit._source as any;
      const activeItems = (ticket.ticketItems || []).filter(
        (item: any) => !item.deletedAt,
      );
      const seatClasses = uniqueValues(activeItems.map((item: any) => item.seatClass));
      const seatTypes = uniqueValues(activeItems.map((item: any) => item.seatType));
      const minPrice = getMinPrice(activeItems);
      const availableSeats = activeItems.reduce(
        (total: number, item: any) => total + getAvailableSeats(item),
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
        dateStart: ticket.dateStart,
        dateEnd: ticket.dateEnd,
        minPrice,
        availableSeats,
        seatClasses,
        seatTypes,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalValue,
        totalPages: totalValue === 0 ? 0 : Math.ceil(totalValue / limit),
      },
    };
  }

  async suggestStations(query: string): Promise<{ code: string; name: string }[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const res = await this.esService.search({
        index: this.index,
        size: 50,
        _source: ['departureStationCode', 'departureStationName', 'arrivalStationCode', 'arrivalStationName'],
        query: {
          bool: {
            filter: [
              { term: { status: 1 } },
              { bool: { must_not: { exists: { field: 'deletedAt' } } } },
            ],
            should: [
              { match_phrase_prefix: { departureStationName: trimmed } },
              { match_phrase_prefix: { arrivalStationName: trimmed } },
              { prefix: { departureStationCode: trimmed.toUpperCase() } },
              { prefix: { arrivalStationCode: trimmed.toUpperCase() } },
            ],
            minimum_should_match: 1,
          },
        },
      });

      const stationsMap = new Map<string, string>();
      const hits = res.hits?.hits || [];
      for (const hit of hits) {
        const doc = hit._source as any;
        if (!doc) continue;
        if (doc.departureStationCode && doc.departureStationName) {
          stationsMap.set(doc.departureStationCode.toUpperCase(), doc.departureStationName);
        }
        if (doc.arrivalStationCode && doc.arrivalStationName) {
          stationsMap.set(doc.arrivalStationCode.toUpperCase(), doc.arrivalStationName);
        }
      }

      return Array.from(stationsMap.entries()).map(([code, name]) => ({
        code,
        name,
      }));
    } catch (error) {
      this.logger.error(`Error suggesting stations for query "${query}":`, error);
      return [];
    }
  }

  async bulkIndex(tickets: any[]): Promise<{ indexed: number; errors: number }> {
    if (!tickets || tickets.length === 0) {
      return { indexed: 0, errors: 0 };
    }
    try {
      const body = tickets.flatMap((ticket) => {
        const sanitized = {
          ...ticket,
          createdAt: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : null,
          updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : null,
          deletedAt: ticket.deletedAt ? new Date(ticket.deletedAt).toISOString() : null,
          dateStart: ticket.dateStart ? new Date(ticket.dateStart).toISOString() : null,
          dateEnd: ticket.dateEnd ? new Date(ticket.dateEnd).toISOString() : null,
          ticketItems: ticket.ticketItems
            ? ticket.ticketItems.map((item: any) => ({
                ...item,
                priceOriginal: item.priceOriginal ? Number(item.priceOriginal) : null,
                priceFlash: item.priceFlash ? Number(item.priceFlash) : null,
                saleStartTime: item.saleStartTime ? new Date(item.saleStartTime).toISOString() : null,
                saleEndTime: item.saleEndTime ? new Date(item.saleEndTime).toISOString() : null,
                createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
                updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
                deletedAt: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
              }))
            : [],
        };
        return [
          { index: { _index: this.index, _id: ticket.id } },
          sanitized,
        ];
      });

      const res = await this.esService.bulk({ refresh: true, operations: body });
      let errorsCount = 0;
      if (res.errors) {
        for (const item of res.items) {
          const action = Object.keys(item)[0];
          const operation = (item as any)[action];
          if (operation.error) {
            errorsCount++;
            this.logger.error(`Bulk operation error for id ${operation._id}:`, operation.error);
          }
        }
      }

      return {
        indexed: tickets.length - errorsCount,
        errors: errorsCount,
      };
    } catch (error) {
      this.logger.error('Error during bulk indexing:', error);
      return { indexed: 0, errors: tickets.length };
    }
  }
}
