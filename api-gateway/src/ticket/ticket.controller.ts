import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
} from '../common/dto/ticket.dto';
import { TicketService } from './ticket.service';
import { Public } from '../common/decorator/public.decorator';
import { Roles, UserRole } from '../common/decorator/roles.decorator';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('health')
  @Public()
  health() {
    return this.ticketService.health();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() payload: CreateTicketRequest) {
    return this.ticketService.create(payload);
  }

  @Get()
  @Public()
  findAll(@Query() query: FindTicketsQuery) {
    return this.ticketService.findAll(query);
  }

  @Get(':ticketId')
  @Public()
  findOne(@Param('ticketId') ticketId: string) {
    return this.ticketService.findOne(ticketId);
  }

  @Patch(':ticketId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('ticketId') ticketId: string,
    @Body() payload: UpdateTicketRequest,
  ) {
    return this.ticketService.update(ticketId, payload);
  }

  @Delete(':ticketId')
  @Roles(UserRole.ADMIN)
  remove(@Param('ticketId') ticketId: string) {
    return this.ticketService.remove(ticketId);
  }

  @Get(':ticketId/availability')
  @Public()
  availability(@Param('ticketId') ticketId: string) {
    return this.ticketService.availability(ticketId);
  }

  @Post(':ticketId/reserve')
  reserve(
    @Param('ticketId') ticketId: string,
    @Body() payload: ReserveTicketRequest,
  ) {
    return this.ticketService.reserve(ticketId, payload);
  }

  @Post(':ticketId/release')
  release(
    @Param('ticketId') ticketId: string,
    @Body() payload: ReleaseTicketRequest,
  ) {
    return this.ticketService.release(ticketId, payload);
  }

  @Post(':ticketId/ticket-items')
  @Roles(UserRole.ADMIN)
  addTicketItem(
    @Param('ticketId') ticketId: string,
    @Body() payload: CreateTicketItemRequest,
  ) {
    return this.ticketService.addTicketItem(ticketId, payload);
  }

  @Patch(':ticketId/ticket-items/:ticketItemId')
  @Roles(UserRole.ADMIN)
  updateTicketItem(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
    @Body() payload: UpdateTicketItemRequest,
  ) {
    return this.ticketService.updateTicketItem(ticketId, ticketItemId, payload);
  }

  @Delete(':ticketId/ticket-items/:ticketItemId')
  @Roles(UserRole.ADMIN)
  removeTicketItem(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
  ) {
    return this.ticketService.removeTicketItem(ticketId, ticketItemId);
  }

  @Post(':ticketId/publish')
  @Roles(UserRole.ADMIN)
  publish(@Param('ticketId') ticketId: string) {
    return this.ticketService.publish(ticketId);
  }

  @Post(':ticketId/unpublish')
  @Roles(UserRole.ADMIN)
  unpublish(@Param('ticketId') ticketId: string) {
    return this.ticketService.unpublish(ticketId);
  }

  @Post(':ticketId/prepare-stock')
  @Roles(UserRole.ADMIN)
  prepareStock(
    @Param('ticketId') ticketId: string,
    @Body() payload: PrepareStockRequest,
  ) {
    return this.ticketService.prepareStock(ticketId, payload);
  }

  @Post(':ticketId/open-sale')
  @Roles(UserRole.ADMIN)
  openSale(
    @Param('ticketId') ticketId: string,
    @Body() payload: OpenSaleRequest,
  ) {
    return this.ticketService.openSale(ticketId, payload);
  }

  @Post(':ticketId/close-sale')
  @Roles(UserRole.ADMIN)
  closeSale(@Param('ticketId') ticketId: string) {
    return this.ticketService.closeSale(ticketId);
  }

  @Get(':ticketId/seat-map')
  @Public()
  seatMap(@Param('ticketId') ticketId: string) {
    return this.ticketService.seatMap(ticketId);
  }

  @Get(':ticketId/ticket-items/:ticketItemId')
  @Public()
  findTicketItem(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
  ) {
    return this.ticketService.findTicketItem(ticketId, ticketItemId);
  }

  @Get(':ticketId/ticket-items/:ticketItemId/availability')
  @Public()
  ticketItemAvailability(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
  ) {
    return this.ticketService.ticketItemAvailability(ticketId, ticketItemId);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/reserve-seat')
  reserveSeat(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
    @Body() payload: ReserveSeatRequest,
  ) {
    return this.ticketService.reserveSeat(ticketId, ticketItemId, payload);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/release-seat')
  releaseSeat(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
    @Body() payload: ReleaseSeatRequest,
  ) {
    return this.ticketService.releaseSeat(ticketId, ticketItemId, payload);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/change-price')
  @Roles(UserRole.ADMIN)
  changePrice(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
    @Body() payload: ChangePriceRequest,
  ) {
    return this.ticketService.changePrice(ticketId, ticketItemId, payload);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/change-sale-window')
  @Roles(UserRole.ADMIN)
  changeSaleWindow(
    @Param('ticketId') ticketId: string,
    @Param('ticketItemId') ticketItemId: string,
    @Body() payload: ChangeSaleWindowRequest,
  ) {
    return this.ticketService.changeSaleWindow(ticketId, ticketItemId, payload);
  }
}
