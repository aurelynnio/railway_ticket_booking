import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class ValidateVoucherRequest {
  @IsString()
  @IsNotEmpty()
  code: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsOptional()
  @IsString()
  userId?: string;
}

export interface ValidateVoucherResponse {
  isValid: boolean;
  voucherId?: string;
  code: string;
  title?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export class CreateVoucherRequest {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['PERCENT', 'FIXED_AMOUNT'])
  discountType: 'PERCENT' | 'FIXED_AMOUNT';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  discountValue: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsString()
  @IsNotEmpty()
  validTo: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVoucherRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['PERCENT', 'FIXED_AMOUNT'])
  discountType?: 'PERCENT' | 'FIXED_AMOUNT';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  discountValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListVouchersQuery {
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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface VoucherResponse {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

