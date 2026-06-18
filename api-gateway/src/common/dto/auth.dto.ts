import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

export class LoginRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RefreshTokenRequest {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}

export class ForgotPasswordRequest {
  @IsEmail()
  email: string;
}

export class ResetPasswordRequest {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ValidateTokenRequest {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ChangePasswordRequest {
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailRequest {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationRequest {
  @IsEmail()
  email: string;
}

export class SocialLoginGoogleRequest {
  @IsString()
  @IsNotEmpty()
  code: string;
}

