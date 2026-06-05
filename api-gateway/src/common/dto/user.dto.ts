import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListUsersQuery {
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

export class UserProfile {
  @IsString()
  userId: string;
}

export class UpdateUserRequest {
  @IsString()
  userId: string;
  @IsNotEmpty()
  payload: Record<string, any>;
}

export class FindByEmailRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class GetUserByIdRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateUserRequest {
  @IsNotEmpty()
  payload: Record<string, any>;
}
