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
