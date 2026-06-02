import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import type { SearchTripsQuery } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('health')
  health() {
    return this.searchService.health();
  }

  @Get('trips')
  trips(@Query() query: SearchTripsQuery) {
    return this.searchService.trips(query);
  }
}
