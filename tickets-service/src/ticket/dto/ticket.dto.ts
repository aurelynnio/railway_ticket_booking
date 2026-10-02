import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum TicketStatus {
  Draft = 0,
  Published = 1,
}

/** Upper bound for seat-label arrays. */
export const MAX_SEAT_LABELS = 500;
/** Upper bound for stock counters. */
export const MAX_STOCK = 1_000_000;
/** Upper bound for a single order's seat count. */
export const MAX_RESERVE_QUANTITY = 50;

export class FindTicketsQuery {
  @IsOptional()
  @IsString()
  departureStationCode?: string;

  @IsOptional()
  @IsString()
  arrivalStationCode?: string;

  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CreateTicketItemRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coachCode?: string;

  @IsOptional()
  @IsString()
  seatClass?: string;

  @IsOptional()
  @IsString()
  seatType?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_SEAT_LABELS)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_SEAT_LABELS)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  availableSeatLabels?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stockInitial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stockAvailable?: number;

  @IsOptional()
  @IsBoolean()
  stockPrepared?: boolean;

  @IsOptional()
  @Type(() => String)
  @Matches(/^\d+$/)
  priceOriginal?: number | string;

  @IsOptional()
  @Type(() => String)
  @Matches(/^\d+$/)
  priceFlash?: number | string;

  @IsOptional()
  @IsDateString()
  saleStartTime?: string;

  @IsOptional()
  @IsDateString()
  saleEndTime?: string;
}

export class UpdateTicketItemRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coachCode?: string;

  @IsOptional()
  @IsString()
  seatClass?: string;

  @IsOptional()
  @IsString()
  seatType?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_SEAT_LABELS)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_SEAT_LABELS)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  availableSeatLabels?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stockInitial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stockAvailable?: number;

  @IsOptional()
  @IsBoolean()
  stockPrepared?: boolean;

  @IsOptional()
  @Type(() => String)
  @Matches(/^\d+$/)
  priceOriginal?: number | string;

  @IsOptional()
  @Type(() => String)
  @Matches(/^\d+$/)
  priceFlash?: number | string;

  @IsOptional()
  @IsDateString()
  saleStartTime?: string;

  @IsOptional()
  @IsDateString()
  saleEndTime?: string;

  @IsOptional()
  @IsDateString()
  deletedAt?: string | null;
}

export class CreateTicketRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  trainNumber?: string;

  @IsOptional()
  @IsString()
  departureStationCode?: string;

  @IsOptional()
  @IsString()
  departureStationName?: string;

  @IsOptional()
  @IsString()
  arrivalStationCode?: string;

  @IsOptional()
  @IsString()
  arrivalStationName?: string;

  @IsOptional()
  @IsString()
  journeyNote?: string;

  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketItemRequest)
  ticketItems?: CreateTicketItemRequest[];
}

export class UpdateTicketRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  trainNumber?: string;

  @IsOptional()
  @IsString()
  departureStationCode?: string;

  @IsOptional()
  @IsString()
  departureStationName?: string;

  @IsOptional()
  @IsString()
  arrivalStationCode?: string;

  @IsOptional()
  @IsString()
  arrivalStationName?: string;

  @IsOptional()
  @IsString()
  journeyNote?: string;

  @IsOptional()
  @IsDateString()
  dateStart?: string;

  @IsOptional()
  @IsDateString()
  dateEnd?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}

export class ReserveTicketRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  seatLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RESERVE_QUANTITY)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  passengerId?: string;
}

export class ReleaseTicketRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketItemId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  seatLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RESERVE_QUANTITY)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  passengerId?: string;
}

export class PrepareStockRequest {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ticketItemId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stockInitial?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_SEAT_LABELS)
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  availableSeatLabels?: string[];
}

export class OpenSaleRequest {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ticketItemId?: string;

  @IsOptional()
  @IsDateString()
  saleStartTime?: string;

  @IsOptional()
  @IsDateString()
  saleEndTime?: string;
}

export class ReserveSeatRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  seatLabel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  passengerId?: string;
}

export class ReleaseSeatRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  seatLabel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  passengerId?: string;
}

export class ChangePriceRequest {
  @IsOptional()
  @Type(() => String)
  @Matches(/^\d+$/)
  priceOriginal?: number | string;

  @IsOptional()
  @Type(() => String)
  @Matches(/^\d+$/)
  priceFlash?: number | string;
}

export class ChangeSaleWindowRequest {
  @IsOptional()
  @IsDateString()
  saleStartTime?: string;

  @IsOptional()
  @IsDateString()
  saleEndTime?: string;
}

export interface TicketItemResponse {
  id: string;
  ticketId: string | null;
  name: string | null;
  description: string | null;
  coachCode: string | null;
  seatClass: string | null;
  seatType: string | null;
  seatLabels: string[];
  availableSeatLabels: string[];
  occupiedSeatLabels: string[];
  stockInitial: number | null;
  stockAvailable: number | null;
  stockPrepared: boolean;
  priceOriginal: string | null;
  priceFlash: string | null;
  saleStartTime: string | null;
  saleEndTime: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  saleOpen: boolean;
}

export interface TicketResponse {
  id: string;
  title: string | null;
  trainNumber: string | null;
  departureStationCode: string | null;
  departureStationName: string | null;
  arrivalStationCode: string | null;
  arrivalStationName: string | null;
  journeyNote: string | null;
  dateStart: string | null;
  dateEnd: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  ticketItems: TicketItemResponse[];
}

export interface TicketAvailabilityResponse {
  ticketId: string;
  status: number;
  saleOpen: boolean;
  items: TicketItemResponse[];
}

export interface PaginatedTicketResponse {
  data: TicketResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

