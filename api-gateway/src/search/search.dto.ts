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
  @IsIn(['recommended', 'price', 'departure'])
  sort?: string;

  @IsOptional()
  @IsString()
  @IsIn(['morning', 'afternoon', 'evening'])
  timeOfDay?: string;

  @IsOptional()
  @IsString()
  @IsIn(['seat', 'sleeper'])
  seatClass?: string;

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
