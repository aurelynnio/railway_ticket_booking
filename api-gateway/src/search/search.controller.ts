import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchByNameQuery, SearchTripsQuery } from './search.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Search')
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

  @Get('by-name')
  @Public()
  searchByName(@Query() query: SearchByNameQuery) {
    const keyword = query.name || query.q || '';
    return this.searchService.searchByName(keyword, query.limit);
  }

  @Get('trains')
  @Public()
  searchTrains(@Query() query: SearchByNameQuery) {
    const keyword = query.name || query.q || '';
    return this.searchService.searchByName(keyword, query.limit);
  }
}
