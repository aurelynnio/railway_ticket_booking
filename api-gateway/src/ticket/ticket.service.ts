import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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

@Injectable()
export class TicketService {
  constructor(
    @Inject('ticket_service') private readonly ticketClient: ClientProxy,
  ) {}

  health() {
    return this.ticketClient.send({ cmd: 'tickets.health' }, {});
  }

  create(payload: CreateTicketRequest) {
    return this.ticketClient.send({ cmd: 'tickets.create' }, payload);
  }

  findAll(query: FindTicketsQuery) {
    return this.ticketClient.send({ cmd: 'tickets.find_all' }, query);
  }

  findOne(ticketId: string) {
    return this.ticketClient.send({ cmd: 'tickets.find_one' }, { ticketId });
  }

  update(ticketId: string, payload: UpdateTicketRequest) {
    return this.ticketClient.send(
      { cmd: 'tickets.update' },
      { ticketId, payload },
    );
  }

  remove(ticketId: string) {
    return this.ticketClient.send({ cmd: 'tickets.remove' }, { ticketId });
  }

  availability(ticketId: string) {
    return this.ticketClient.send(
      { cmd: 'tickets.availability' },
      { ticketId },
    );
  }

  reserve(ticketId: string, payload: ReserveTicketRequest) {
    return this.ticketClient.send(
      { cmd: 'tickets.reserve' },
      { ticketId, payload },
    );
  }

  release(ticketId: string, payload: ReleaseTicketRequest) {
    return this.ticketClient.send(
      { cmd: 'tickets.release' },
      { ticketId, payload },
    );
  }

  addTicketItem(ticketId: string, payload: CreateTicketItemRequest) {
    return this.ticketClient.send(
      { cmd: 'tickets.add_ticket_item' },
      { ticketId, payload },
    );
  }

  updateTicketItem(
    ticketId: string,
    ticketItemId: string,
    payload: UpdateTicketItemRequest,
  ) {
    return this.ticketClient.send(
      { cmd: 'tickets.update_ticket_item' },
      { ticketId, ticketItemId, payload },
    );
  }

  removeTicketItem(ticketId: string, ticketItemId: string) {
    return this.ticketClient.send(
      { cmd: 'tickets.remove_ticket_item' },
      { ticketId, ticketItemId },
    );
  }

  publish(ticketId: string) {
    return this.ticketClient.send({ cmd: 'tickets.publish' }, { ticketId });
  }

  unpublish(ticketId: string) {
    return this.ticketClient.send({ cmd: 'tickets.unpublish' }, { ticketId });
  }

  prepareStock(ticketId: string, payload: PrepareStockRequest) {
    return this.ticketClient.send(
      { cmd: 'tickets.prepare_stock' },
      { ticketId, payload },
    );
  }

  openSale(ticketId: string, payload: OpenSaleRequest) {
    return this.ticketClient.send(
      { cmd: 'tickets.open_sale' },
      { ticketId, payload },
    );
  }

  closeSale(ticketId: string) {
    return this.ticketClient.send({ cmd: 'tickets.close_sale' }, { ticketId });
  }

  seatMap(ticketId: string) {
    return this.ticketClient.send({ cmd: 'tickets.seat_map' }, { ticketId });
  }

  findTicketItem(ticketId: string, ticketItemId: string) {
    return this.ticketClient.send(
      { cmd: 'tickets.find_ticket_item' },
      { ticketId, ticketItemId },
    );
  }

  ticketItemAvailability(ticketId: string, ticketItemId: string) {
    return this.ticketClient.send(
      { cmd: 'tickets.ticket_item_availability' },
      { ticketId, ticketItemId },
    );
  }

  reserveSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReserveSeatRequest,
  ) {
    return this.ticketClient.send(
      { cmd: 'tickets.reserve_seat' },
      { ticketId, ticketItemId, payload },
    );
  }

  releaseSeat(
    ticketId: string,
    ticketItemId: string,
    payload: ReleaseSeatRequest,
  ) {
    return this.ticketClient.send(
      { cmd: 'tickets.release_seat' },
      { ticketId, ticketItemId, payload },
    );
  }

  changePrice(
    ticketId: string,
    ticketItemId: string,
    payload: ChangePriceRequest,
  ) {
    return this.ticketClient.send(
      { cmd: 'tickets.change_price' },
      { ticketId, ticketItemId, payload },
    );
  }

  changeSaleWindow(
    ticketId: string,
    ticketItemId: string,
    payload: ChangeSaleWindowRequest,
  ) {
    return this.ticketClient.send(
      { cmd: 'tickets.change_sale_window' },
      { ticketId, ticketItemId, payload },
    );
  }
}
