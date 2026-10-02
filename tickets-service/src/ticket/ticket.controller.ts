import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TicketService } from './ticket.service';
import { SearchTripsQuery } from './dto/search.dto';
import {
  CreateTicketRequest,
  FindTicketsQuery,
} from './dto/ticket.dto';
import {
  AddTicketItemMessage,
  ChangePriceMessage,
  ChangeSaleWindowMessage,
  OpenSaleMessage,
  PrepareStockMessage,
  ReleaseSeatMessage,
  ReleaseTicketMessage,
  ReserveSeatMessage,
  ReserveTicketMessage,
  SearchByNameMessage,
  SuggestStationsMessage,
  TicketIdMessage,
  TicketItemIdMessage,
  UpdateTicketItemMessage,
  UpdateTicketMessage,
} from './dto/ticket-message.dto';

/**
 * Every handler declares a real DTO class for its payload.
 *
 * Inline type literals compile to `Object`, which makes Nest's ValidationPipe
 * skip the handler entirely — so `whitelist` and all the rules declared on the
 * nested DTOs silently did not apply to 20 of the 23 commands. Using classes
 * here is what makes those rules effective on the queue, which is otherwise a
 * validation-free path around the gateway.
 */
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
  suggestStations(@Payload() data: SuggestStationsMessage) {
    return this.ticketService.suggestStations(data.query || '');
  }

  @MessagePattern({ cmd: 'search.by_name' })
  searchByName(@Payload() data: SearchByNameMessage) {
    const keyword = data.name || data.q || '';
    return this.ticketService.searchByName(keyword, data.limit);
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
  findOne(@Payload() data: TicketIdMessage) {
    return this.ticketService.findOne(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.update' })
  update(@Payload() data: UpdateTicketMessage) {
    return this.ticketService.update(data.ticketId, data.payload);
  }

  @MessagePattern({ cmd: 'tickets.remove' })
  remove(@Payload() data: TicketIdMessage) {
    return this.ticketService.remove(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.availability' })
  availability(@Payload() data: TicketIdMessage) {
    return this.ticketService.availability(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.reserve' })
  reserve(@Payload() data: ReserveTicketMessage) {
    return this.ticketService.reserve(data.ticketId, data.payload);
  }

  @MessagePattern({ cmd: 'tickets.add_ticket_item' })
  addTicketItem(@Payload() data: AddTicketItemMessage) {
    return this.ticketService.addTicketItem(data.ticketId, data.payload);
  }

  @MessagePattern({ cmd: 'tickets.update_ticket_item' })
  updateTicketItem(@Payload() data: UpdateTicketItemMessage) {
    return this.ticketService.updateTicketItem(
      data.ticketId,
      data.ticketItemId,
      data.payload,
    );
  }

  @MessagePattern({ cmd: 'tickets.remove_ticket_item' })
  removeTicketItem(@Payload() data: TicketItemIdMessage) {
    return this.ticketService.removeTicketItem(data.ticketId, data.ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.release' })
  release(@Payload() data: ReleaseTicketMessage) {
    return this.ticketService.release(data.ticketId, data.payload);
  }

  @MessagePattern({ cmd: 'tickets.publish' })
  publish(@Payload() data: TicketIdMessage) {
    return this.ticketService.publish(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.unpublish' })
  unpublish(@Payload() data: TicketIdMessage) {
    return this.ticketService.unpublish(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.prepare_stock' })
  prepareStock(@Payload() data: PrepareStockMessage) {
    return this.ticketService.prepareStock(data.ticketId, data.payload);
  }

  @MessagePattern({ cmd: 'tickets.open_sale' })
  openSale(@Payload() data: OpenSaleMessage) {
    return this.ticketService.openSale(data.ticketId, data.payload);
  }

  @MessagePattern({ cmd: 'tickets.close_sale' })
  closeSale(@Payload() data: TicketIdMessage) {
    return this.ticketService.closeSale(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.seat_map' })
  seatMap(@Payload() data: TicketIdMessage) {
    return this.ticketService.seatMap(data.ticketId);
  }

  @MessagePattern({ cmd: 'tickets.find_ticket_item' })
  findTicketItem(@Payload() data: TicketItemIdMessage) {
    return this.ticketService.findTicketItem(data.ticketId, data.ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.ticket_item_availability' })
  ticketItemAvailability(@Payload() data: TicketItemIdMessage) {
    return this.ticketService.ticketItemAvailability(
      data.ticketId,
      data.ticketItemId,
    );
  }

  @MessagePattern({ cmd: 'tickets.reserve_seat' })
  reserveSeat(@Payload() data: ReserveSeatMessage) {
    return this.ticketService.reserveSeat(
      data.ticketId,
      data.ticketItemId,
      data.payload,
    );
  }

  @MessagePattern({ cmd: 'tickets.release_seat' })
  releaseSeat(@Payload() data: ReleaseSeatMessage) {
    return this.ticketService.releaseSeat(
      data.ticketId,
      data.ticketItemId,
      data.payload,
    );
  }

  @MessagePattern({ cmd: 'tickets.change_price' })
  changePrice(@Payload() data: ChangePriceMessage) {
    return this.ticketService.changePrice(
      data.ticketId,
      data.ticketItemId,
      data.payload,
    );
  }

  @MessagePattern({ cmd: 'tickets.change_sale_window' })
  changeSaleWindow(@Payload() data: ChangeSaleWindowMessage) {
    return this.ticketService.changeSaleWindow(
      data.ticketId,
      data.ticketItemId,
      data.payload,
    );
  }
}
