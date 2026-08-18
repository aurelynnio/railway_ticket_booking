import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
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

export class UpdateProfilePayload {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class UpdateUserPayload {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  role?: number;
}

export class CreateUserPayload {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  role?: number;
}

export class UpdateUserRequest {
  @IsString()
  userId: string;

  @ValidateNested()
  @Type(() => UpdateUserPayload)
  payload: UpdateUserPayload;
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

export class DeleteUserRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateUserRequest {
  @ValidateNested()
  @Type(() => CreateUserPayload)
  payload: CreateUserPayload;
}
