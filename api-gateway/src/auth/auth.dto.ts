import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const PASSWORD_RULE =
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include both letters and numbers';

export class RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
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
  @MinLength(8)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
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
  @MinLength(8)
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
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

