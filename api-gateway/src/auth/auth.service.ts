import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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

@Injectable()
export class AuthService {
  constructor(
    @Inject('auth_service') private readonly authClient: ClientProxy,
  ) {}

  login(data: LoginRequest) {
    return this.authClient.send({ cmd: 'auth.login' }, data);
  }

  register(data: RegisterRequest) {
    return this.authClient.send({ cmd: 'auth.register' }, data);
  }

  refreshToken(refreshToken: RefreshTokenRequest) {
    return this.authClient.send(
      {
        cmd: 'auth.refreshToken',
      },
      refreshToken,
    );
  }

  logout(logoutDto: LogoutRequest) {
    return this.authClient.send(
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

  socialLoginGoogle(data: SocialLoginGoogleRequest) {
    return this.authClient.send(
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
