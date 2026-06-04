import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
