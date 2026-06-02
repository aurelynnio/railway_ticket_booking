import { Body, Controller, Get, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import type { ReserveTicketRequest } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('health')
  health() {
    return this.ticketsService.health();
  }

  @Get('availability')
  availability() {
    return this.ticketsService.availability();
  }

  @Post('reserve')
  reserve(@Body() payload: ReserveTicketRequest) {
    return this.ticketsService.reserve(payload);
  }
}
