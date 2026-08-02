import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  SocialLoginGoogleRequest,
} from '../common/dto/auth.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('auth_service') private readonly authClient: ClientProxy,
  ) {}

  health() {
    return this.authClient.send({ cmd: 'auth.health' }, {});
  }

  login(data: LoginRequest): Observable<AuthTokens> {
    return this.authClient.send<AuthTokens>({ cmd: 'auth.login' }, data);
  }

  register(data: RegisterRequest) {
    return this.authClient.send({ cmd: 'auth.register' }, data);
  }

  refreshToken(refreshToken: RefreshTokenRequest): Observable<AuthTokens> {
    return this.authClient.send<AuthTokens>(
      {
        cmd: 'auth.refreshToken',
      },
      refreshToken,
    );
  }

  logout(logoutDto: LogoutRequest): Observable<LogoutResponse> {
    return this.authClient.send<LogoutResponse>(
      {
        cmd: 'auth.logout',
      },
      logoutDto,
    );
  }

  forgotPassword(forgotPasswordDto: ForgotPasswordRequest) {
    return this.authClient.send(
      {
        cmd: 'auth.forgotPassword',
      },
      forgotPasswordDto,
    );
  }
  resetPassword(resetPasswordDto: ResetPasswordRequest) {
    return this.authClient.send(
      {
        cmd: 'auth.resetPassword',
      },
      resetPasswordDto,
    );
  }

  changePassword(userId: string, data: ChangePasswordRequest) {
    return this.authClient.send(
      {
        cmd: 'auth.changePassword',
      },
      {
        userId,
        data,
      },
    );
  }

  verifyEmail(data: VerifyEmailRequest) {
    return this.authClient.send(
      {
        cmd: 'auth.verifyEmail',
      },
      data,
    );
  }

  resendVerification(data: ResendVerificationRequest) {
    return this.authClient.send(
      {
        cmd: 'auth.resendVerification',
      },
      data,
    );
  }

  socialLoginGoogle(data: SocialLoginGoogleRequest): Observable<AuthTokens> {
    return this.authClient.send<AuthTokens>(
      {
        cmd: 'auth.socialLoginGoogle',
      },
      data,
    );
  }

  revokeAllSessions(userId: string) {
    return this.authClient.send(
      {
        cmd: 'auth.revokeAllSessions',
      },
      {
        userId,
      },
    );
  }
}
