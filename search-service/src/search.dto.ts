import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchTripsQuery {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export interface SearchTripResponse {
  ticketId: string;
  title: string | null;
  trainNumber: string | null;
  from: {
    code: string | null;
    name: string | null;
  };
  to: {
    code: string | null;
    name: string | null;
  };
  dateStart: string | null;
  dateEnd: string | null;
  minPrice: number | null;
  availableSeats: number;
  seatClasses: string[];
  seatTypes: string[];
}

export interface PaginatedSearchTripResponse {
  data: SearchTripResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TicketSyncItemPayload {
  id: string;
  ticketId?: string | null;
  name?: string | null;
  description?: string | null;
  coachCode?: string | null;
  seatClass?: string | null;
  seatType?: string | null;
  seatLabels: string[];
  availableSeatLabels: string[];
  stockInitial?: number | null;
  stockAvailable?: number | null;
  stockPrepared?: boolean;
  priceOriginal?: string | number | bigint | null;
  priceFlash?: string | number | bigint | null;
  saleStartTime?: string | Date | null;
  saleEndTime?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
}

export interface TicketSyncPayload {
  id: string;
  title?: string | null;
  trainNumber?: string | null;
  departureStationCode?: string | null;
  departureStationName?: string | null;
  arrivalStationCode?: string | null;
  arrivalStationName?: string | null;
  journeyNote?: string | null;
  dateStart?: string | Date | null;
  dateEnd?: string | Date | null;
  status?: number;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
  ticketItems?: TicketSyncItemPayload[];
}
