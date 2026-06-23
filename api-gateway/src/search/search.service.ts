import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SearchTripsQuery } from './search.dto';

@Injectable()
export class SearchService {
  constructor(
    @Inject('search_service') private readonly searchClient: ClientProxy,
  ) {}

  health() {
    return this.searchClient.send({ cmd: 'search.health' }, {});
  }

  trips(query: SearchTripsQuery) {
    return this.searchClient.send({ cmd: 'search.trips' }, query);
  }

  suggestStations(query: string) {
    return this.searchClient.send({ cmd: 'search.suggest_stations' }, { query });
  }

  sync() {
    return this.searchClient.send({ cmd: 'search.sync' }, {});
  }
}
