import { Injectable } from '@nestjs/common';

export interface SearchTripsQuery {
  from?: string;
  to?: string;
  date?: string;
}

@Injectable()
export class SearchService {
  health() {
    return {
      service: 'search-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  trips(query: SearchTripsQuery) {
    return [
      {
        tripId: 'trip_mock_1',
        from: query.from ?? 'HCM',
        to: query.to ?? 'HN',
        date: query.date ?? new Date().toISOString().slice(0, 10),
        trainCode: 'SE1',
      },
    ];
  }
}
