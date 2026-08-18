import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TicketService } from './ticket.service';
import { SearchTripsQuery } from './search.dto';
import {
  ChangePriceRequest,
  ChangeSaleWindowRequest,
  CreateTicketItemRequest,
  CreateTicketRequest,
  FindTicketsQuery,
  OpenSaleRequest,
  PrepareStockRequest,
  ReleaseSeatRequest,
  ReleaseTicketRequest,
  ReserveSeatRequest,
  ReserveTicketRequest,
  UpdateTicketItemRequest,
  UpdateTicketRequest,
} from './ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @MessagePattern({ cmd: 'tickets.health' })
  health() {
    return this.ticketService.health();
  }

  /*
   * Search handlers (previously search-service).
   * Command names match what api-gateway sends via its /search endpoints.
   */
  @MessagePattern({ cmd: 'search.health' })
  searchHealth() {
    return this.ticketService.health();
  }

  @MessagePattern({ cmd: 'search.trips' })
  searchTrips(@Payload() query: SearchTripsQuery) {
    return this.ticketService.searchTrips(query);
  }

  @MessagePattern({ cmd: 'search.suggest_stations' })
  suggestStations(@Payload() data: { query: string }) {
    return this.ticketService.suggestStations(data.query || '');
  }

  @MessagePattern({ cmd: 'tickets.create' })
  create(@Payload() payload: CreateTicketRequest) {
    return this.ticketService.create(payload);
  }

  @MessagePattern({ cmd: 'tickets.find_all' })
  findAll(@Payload() query: FindTicketsQuery) {
    return this.ticketService.findAll(query);
  }

  @MessagePattern({ cmd: 'tickets.find_one' })
  findOne(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.findOne(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.update' })
  update(@Payload() data: { ticketId: string; payload: UpdateTicketRequest }) {
    const { ticketId, payload } = data;
    return this.ticketService.update(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.remove' })
  remove(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.remove(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.availability' })
  availability(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.availability(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.reserve' })
  reserve(
    @Payload() data: { ticketId: string; payload: ReserveTicketRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketService.reserve(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.add_ticket_item' })
  addTicketItem(
    @Payload() data: { ticketId: string; payload: CreateTicketItemRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketService.addTicketItem(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.update_ticket_item' })
  updateTicketItem(
    @Payload()
    data: {
      ticketId: string;
      ticketItemId: string;
      payload: UpdateTicketItemRequest;
    },
  ) {
    const { ticketId, ticketItemId, payload } = data;
    return this.ticketService.updateTicketItem(
      ticketId,
      ticketItemId,
      payload,
    );
  }

  @MessagePattern({ cmd: 'tickets.remove_ticket_item' })
  removeTicketItem(
    @Payload() data: { ticketId: string; ticketItemId: string },
  ) {
    const { ticketId, ticketItemId } = data;
    return this.ticketService.removeTicketItem(ticketId, ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.release' })
  release(
    @Payload() data: { ticketId: string; payload: ReleaseTicketRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketService.release(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.publish' })
  publish(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.publish(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.unpublish' })
  unpublish(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.unpublish(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.prepare_stock' })
  prepareStock(
    @Payload() data: { ticketId: string; payload: PrepareStockRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketService.prepareStock(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.open_sale' })
  openSale(@Payload() data: { ticketId: string; payload: OpenSaleRequest }) {
    const { ticketId, payload } = data;
    return this.ticketService.openSale(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.close_sale' })
  closeSale(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.closeSale(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.seat_map' })
  seatMap(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketService.seatMap(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.find_ticket_item' })
  findTicketItem(@Payload() data: { ticketId: string; ticketItemId: string }) {
    const { ticketId, ticketItemId } = data;
    return this.ticketService.findTicketItem(ticketId, ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.ticket_item_availability' })
  ticketItemAvailability(
    @Payload() data: { ticketId: string; ticketItemId: string },
  ) {
    const { ticketId, ticketItemId } = data;
    return this.ticketService.ticketItemAvailability(ticketId, ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.reserve_seat' })
  reserveSeat(
    @Payload()
    data: {
      ticketId: string;
      ticketItemId: string;
      payload: ReserveSeatRequest;
    },
  ) {
    const { ticketId, ticketItemId, payload } = data;
    return this.ticketService.reserveSeat(ticketId, ticketItemId, payload);
  }

  @MessagePattern({ cmd: 'tickets.release_seat' })
  releaseSeat(
    @Payload()
    data: {
      ticketId: string;
      ticketItemId: string;
      payload: ReleaseSeatRequest;
    },
  ) {
    const { ticketId, ticketItemId, payload } = data;
    return this.ticketService.releaseSeat(ticketId, ticketItemId, payload);
  }

  @MessagePattern({ cmd: 'tickets.change_price' })
  changePrice(
    @Payload()
    data: {
      ticketId: string;
      ticketItemId: string;
      payload: ChangePriceRequest;
    },
  ) {
    const { ticketId, ticketItemId, payload } = data;
    return this.ticketService.changePrice(ticketId, ticketItemId, payload);
  }

  @MessagePattern({ cmd: 'tickets.change_sale_window' })
  changeSaleWindow(
    @Payload()
    data: {
      ticketId: string;
      ticketItemId: string;
      payload: ChangeSaleWindowRequest;
    },
  ) {
    const { ticketId, ticketItemId, payload } = data;
    return this.ticketService.changeSaleWindow(
      ticketId,
      ticketItemId,
      payload,
    );
  }
}
