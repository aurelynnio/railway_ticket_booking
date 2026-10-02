import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ChangePriceRequest,
  ChangeSaleWindowRequest,
  CreateTicketItemRequest,
  PrepareStockRequest,
  OpenSaleRequest,
  ReleaseSeatRequest,
  ReleaseTicketRequest,
  ReserveSeatRequest,
  ReserveTicketRequest,
  UpdateTicketItemRequest,
  UpdateTicketRequest,
} from './ticket.dto';

/**
 * Message-payload wrappers for the RMQ handlers.
 *
 * These exist so the global ValidationPipe actually runs. Nest skips validation
 * when the declared metatype is a bare `Object`, which is what an inline type
 * literal compiles to — so every handler that used `@Payload() data: { ... }`
 * silently bypassed `whitelist` and all DTO rules (prices, stock counts, seat
 * arrays). Declaring real classes makes the nested DTO decorators effective and
 * keeps the queue from being a validation-free bypass around the gateway.
 */

/** Upper bound for seat arrays coming over the queue. */
export const MAX_SEAT_LABELS = 500;

export class TicketIdMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;
}

export class TicketItemIdMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId: string;
}

export class UpdateTicketMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @ValidateNested()
  @Type(() => UpdateTicketRequest)
  payload: UpdateTicketRequest;
}

export class UpdateTicketItemMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId: string;

  @ValidateNested()
  @Type(() => UpdateTicketItemRequest)
  payload: UpdateTicketItemRequest;
}

export class AddTicketItemMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @ValidateNested()
  @Type(() => CreateTicketItemRequest)
  payload: CreateTicketItemRequest;
}

export class ReserveTicketMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @ValidateNested()
  @Type(() => ReserveTicketRequest)
  payload: ReserveTicketRequest;
}

export class ReleaseTicketMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @ValidateNested()
  @Type(() => ReleaseTicketRequest)
  payload: ReleaseTicketRequest;
}

export class PrepareStockMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @ValidateNested()
  @Type(() => PrepareStockRequest)
  payload: PrepareStockRequest;
}

export class OpenSaleMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @ValidateNested()
  @Type(() => OpenSaleRequest)
  payload: OpenSaleRequest;
}

export class ReserveSeatMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId: string;

  @ValidateNested()
  @Type(() => ReserveSeatRequest)
  payload: ReserveSeatRequest;
}

export class ReleaseSeatMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId: string;

  @ValidateNested()
  @Type(() => ReleaseSeatRequest)
  payload: ReleaseSeatRequest;
}

export class ChangePriceMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId: string;

  @ValidateNested()
  @Type(() => ChangePriceRequest)
  payload: ChangePriceRequest;
}

export class ChangeSaleWindowMessage {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId: string;

  @ValidateNested()
  @Type(() => ChangeSaleWindowRequest)
  payload: ChangeSaleWindowRequest;
}

/*
 * Search handlers.
 * Command names match what api-gateway sends via its /search endpoints.
 */
export class SuggestStationsMessage {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  query?: string;
}

export class SearchByNameMessage {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
