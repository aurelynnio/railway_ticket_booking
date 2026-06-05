import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SearchService } from './search.service';
import { SearchTripsQuery } from './search.dto';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @MessagePattern({ cmd: 'search.health' })
  health() {
    return this.searchService.health();
  }

  @MessagePattern({ cmd: 'search.trips' })
  trips(@Payload() query: SearchTripsQuery) {
    return this.searchService.trips(query);
  }
}
