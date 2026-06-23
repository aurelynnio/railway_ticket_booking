import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchTripsQuery } from './search.dto';
import { Public } from '../common/decorator/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('health')
  @Public()
  health() {
    return this.searchService.health();
  }

  @Get('trips')
  @Public()
  trips(@Query() query: SearchTripsQuery) {
    return this.searchService.trips(query);
  }

  @Get('suggest-stations')
  @Public()
  suggestStations(@Query('q') query: string) {
    return this.searchService.suggestStations(query || '');
  }
}
