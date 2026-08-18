import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export enum TicketStatus {
  Draft = 0,
  Published = 1,
}

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
  @IsString({ each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  availableSeatLabels?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockInitial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
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
  @IsString({ each: true })
  seatLabels?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  availableSeatLabels?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockInitial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
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
  ticketItemId!: string;

  @IsOptional()
  @IsString()
  seatLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  passengerId?: string;
}

export class ReleaseTicketRequest {
  @IsString()
  ticketItemId!: string;

  @IsOptional()
  @IsString()
  seatLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  passengerId?: string;
}

export class PrepareStockRequest {
  @IsOptional()
  @IsString()
  ticketItemId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockInitial?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  availableSeatLabels?: string[];
}

export class OpenSaleRequest {
  @IsOptional()
  @IsString()
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
  seatLabel!: string;

  @IsOptional()
  @IsString()
  passengerId?: string;
}

export class ReleaseSeatRequest {
  @IsString()
  seatLabel!: string;

  @IsOptional()
  @IsString()
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
  priceOriginal: number | null;
  priceFlash: number | null;
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
