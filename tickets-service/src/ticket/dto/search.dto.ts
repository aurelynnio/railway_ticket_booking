import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const SEARCH_SORT_OPTIONS = ['recommended', 'price', 'departure'] as const;
export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number];

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
  @IsString()
  @IsIn(SEARCH_SORT_OPTIONS)
  sort?: SearchSort;

  @IsOptional()
  @IsString()
  @IsIn(['morning', 'afternoon', 'evening'])
  timeOfDay?: 'morning' | 'afternoon' | 'evening';

  @IsOptional()
  @IsString()
  @IsIn(['seat', 'sleeper'])
  seatClass?: 'seat' | 'sleeper';

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
  minPrice: string | null;
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

