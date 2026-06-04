import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TicketsService } from './tickets.service';
import type {
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
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @MessagePattern({ cmd: 'tickets.health' })
  health() {
    return this.ticketsService.health();
  }

  @MessagePattern({ cmd: 'tickets.create' })
  create(@Payload() payload: CreateTicketRequest) {
    return this.ticketsService.create(payload);
  }

  @MessagePattern({ cmd: 'tickets.find_all' })
  findAll(@Payload() query: FindTicketsQuery) {
    return this.ticketsService.findAll(query);
  }

  @MessagePattern({ cmd: 'tickets.find_one' })
  findOne(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.findOne(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.update' })
  update(@Payload() data: { ticketId: string; payload: UpdateTicketRequest }) {
    const { ticketId, payload } = data;
    return this.ticketsService.update(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.remove' })
  remove(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.remove(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.availability' })
  availability(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.availability(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.reserve' })
  reserve(
    @Payload() data: { ticketId: string; payload: ReserveTicketRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketsService.reserve(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.add_ticket_item' })
  addTicketItem(
    @Payload() data: { ticketId: string; payload: CreateTicketItemRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketsService.addTicketItem(ticketId, payload);
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
    return this.ticketsService.updateTicketItem(
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
    return this.ticketsService.removeTicketItem(ticketId, ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.release' })
  release(
    @Payload() data: { ticketId: string; payload: ReleaseTicketRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketsService.release(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.publish' })
  publish(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.publish(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.unpublish' })
  unpublish(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.unpublish(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.prepare_stock' })
  prepareStock(
    @Payload() data: { ticketId: string; payload: PrepareStockRequest },
  ) {
    const { ticketId, payload } = data;
    return this.ticketsService.prepareStock(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.open_sale' })
  openSale(@Payload() data: { ticketId: string; payload: OpenSaleRequest }) {
    const { ticketId, payload } = data;
    return this.ticketsService.openSale(ticketId, payload);
  }

  @MessagePattern({ cmd: 'tickets.close_sale' })
  closeSale(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.closeSale(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.seat_map' })
  seatMap(@Payload() data: { ticketId: string }) {
    const { ticketId } = data;
    return this.ticketsService.seatMap(ticketId);
  }

  @MessagePattern({ cmd: 'tickets.find_ticket_item' })
  findTicketItem(@Payload() data: { ticketId: string; ticketItemId: string }) {
    const { ticketId, ticketItemId } = data;
    return this.ticketsService.findTicketItem(ticketId, ticketItemId);
  }

  @MessagePattern({ cmd: 'tickets.ticket_item_availability' })
  ticketItemAvailability(
    @Payload() data: { ticketId: string; ticketItemId: string },
  ) {
    const { ticketId, ticketItemId } = data;
    return this.ticketsService.ticketItemAvailability(ticketId, ticketItemId);
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
    return this.ticketsService.reserveSeat(ticketId, ticketItemId, payload);
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
    return this.ticketsService.releaseSeat(ticketId, ticketItemId, payload);
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
    return this.ticketsService.changePrice(ticketId, ticketItemId, payload);
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
    return this.ticketsService.changeSaleWindow(
      ticketId,
      ticketItemId,
      payload,
    );
  }
}
