export class RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export class LoginRequest {
  email: string;
  password: string;
}

export class RefreshTokenRequest {
  refreshToken: string;
}

export class ForgotPasswordRequest {
  email: string;
}

export class ResetPasswordRequest {
  token: string;
  newPassword: string;
}
