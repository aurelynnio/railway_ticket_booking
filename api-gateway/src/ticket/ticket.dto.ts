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
import { IsUuidLike } from '../common/validators/uuid-like.validator';

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
  @Matches(/^\d+$/, { message: 'status must be a number' })
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
  @IsUuidLike('ticketItemId')
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
  @IsUuidLike('ticketItemId')
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
  @IsUuidLike('ticketItemId')
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
  @IsUuidLike('ticketItemId')
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
