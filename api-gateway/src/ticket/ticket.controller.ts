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
import { ApiTags } from '@nestjs/swagger';
import { UuidLikePipe } from '../common/pipes/uuid-like.pipe';
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
import { TicketService } from './ticket.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@ApiTags('Tickets')
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
  findOne(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.findOne(ticketId);
  }

  @Patch(':ticketId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Body() payload: UpdateTicketRequest,
  ) {
    return this.ticketService.update(ticketId, payload);
  }

  @Delete(':ticketId')
  @Roles(UserRole.ADMIN)
  remove(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.remove(ticketId);
  }

  @Get(':ticketId/availability')
  @Public()
  availability(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.availability(ticketId);
  }

  @Post(':ticketId/reserve')
  @Roles(UserRole.ADMIN)
  reserve(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Body() payload: ReserveTicketRequest,
  ) {
    return this.ticketService.reserve(ticketId, payload);
  }

  @Post(':ticketId/release')
  @Roles(UserRole.ADMIN)
  release(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Body() payload: ReleaseTicketRequest,
  ) {
    return this.ticketService.release(ticketId, payload);
  }

  @Post(':ticketId/ticket-items')
  @Roles(UserRole.ADMIN)
  addTicketItem(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Body() payload: CreateTicketItemRequest,
  ) {
    return this.ticketService.addTicketItem(ticketId, payload);
  }

  @Patch(':ticketId/ticket-items/:ticketItemId')
  @Roles(UserRole.ADMIN)
  updateTicketItem(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
    @Body() payload: UpdateTicketItemRequest,
  ) {
    return this.ticketService.updateTicketItem(ticketId, ticketItemId, payload);
  }

  @Delete(':ticketId/ticket-items/:ticketItemId')
  @Roles(UserRole.ADMIN)
  removeTicketItem(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
  ) {
    return this.ticketService.removeTicketItem(ticketId, ticketItemId);
  }

  @Post(':ticketId/publish')
  @Roles(UserRole.ADMIN)
  publish(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.publish(ticketId);
  }

  @Post(':ticketId/unpublish')
  @Roles(UserRole.ADMIN)
  unpublish(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.unpublish(ticketId);
  }

  @Post(':ticketId/prepare-stock')
  @Roles(UserRole.ADMIN)
  prepareStock(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Body() payload: PrepareStockRequest,
  ) {
    return this.ticketService.prepareStock(ticketId, payload);
  }

  @Post(':ticketId/open-sale')
  @Roles(UserRole.ADMIN)
  openSale(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Body() payload: OpenSaleRequest,
  ) {
    return this.ticketService.openSale(ticketId, payload);
  }

  @Post(':ticketId/close-sale')
  @Roles(UserRole.ADMIN)
  closeSale(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.closeSale(ticketId);
  }

  @Get(':ticketId/seat-map')
  @Public()
  seatMap(@Param('ticketId', UuidLikePipe) ticketId: string) {
    return this.ticketService.seatMap(ticketId);
  }

  @Get(':ticketId/ticket-items/:ticketItemId')
  @Public()
  findTicketItem(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
  ) {
    return this.ticketService.findTicketItem(ticketId, ticketItemId);
  }

  @Get(':ticketId/ticket-items/:ticketItemId/availability')
  @Public()
  ticketItemAvailability(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
  ) {
    return this.ticketService.ticketItemAvailability(ticketId, ticketItemId);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/reserve-seat')
  @Roles(UserRole.ADMIN)
  reserveSeat(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
    @Body() payload: ReserveSeatRequest,
  ) {
    return this.ticketService.reserveSeat(ticketId, ticketItemId, payload);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/release-seat')
  @Roles(UserRole.ADMIN)
  releaseSeat(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
    @Body() payload: ReleaseSeatRequest,
  ) {
    return this.ticketService.releaseSeat(ticketId, ticketItemId, payload);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/change-price')
  @Roles(UserRole.ADMIN)
  changePrice(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
    @Body() payload: ChangePriceRequest,
  ) {
    return this.ticketService.changePrice(ticketId, ticketItemId, payload);
  }

  @Post(':ticketId/ticket-items/:ticketItemId/change-sale-window')
  @Roles(UserRole.ADMIN)
  changeSaleWindow(
    @Param('ticketId', UuidLikePipe) ticketId: string,
    @Param('ticketItemId', UuidLikePipe) ticketItemId: string,
    @Body() payload: ChangeSaleWindowRequest,
  ) {
    return this.ticketService.changeSaleWindow(ticketId, ticketItemId, payload);
  }
}
