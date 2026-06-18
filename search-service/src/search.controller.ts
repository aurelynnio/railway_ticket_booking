import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
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

  @EventPattern('ticket.created')
  async handleTicketCreated(@Payload() data: any) {
    await this.searchService.upsertTicket(data);
  }

  @EventPattern('ticket.updated')
  async handleTicketUpdated(@Payload() data: any) {
    await this.searchService.upsertTicket(data);
  }

  @EventPattern('ticket.deleted')
  async handleTicketDeleted(@Payload() data: { ticketId: string }) {
    await this.searchService.deleteTicket(data.ticketId);
  }
}
