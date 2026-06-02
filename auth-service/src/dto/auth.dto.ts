import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  username: string;
}

export class LoginRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class ForgotPasswordRequest {
  @IsEmail()
  email: string;
}

export class RefreshTokenRequest {
  @IsString()
  refreshToken: string;
}

export class NewUser {}
