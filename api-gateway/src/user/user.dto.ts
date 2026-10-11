import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
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
  @Max(100)
  limit?: number;
}

export class UserProfile {
  @IsString()
  userId: string;
}

/**
 * Row shape returned by auth-service's `users.list`. Only the fields this
 * gateway reads are declared.
 */
export interface UserRecord {
  id: string;
  email: string;
}

/** `users.list` answers with a paginated `{ data }` envelope or a bare array. */
export type UserListPayload = UserRecord[] | { data?: UserRecord[] };

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

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatar?: string | null;
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
  @IsString()
  @MaxLength(2048)
  avatar?: string | null;

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
  @IsString()
  @MaxLength(2048)
  avatar?: string | null;

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
