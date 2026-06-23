export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ValidateTokenRequest {
  token: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthSessionResponse {
  userId: string;
  email: string;
  role?: number;
}
