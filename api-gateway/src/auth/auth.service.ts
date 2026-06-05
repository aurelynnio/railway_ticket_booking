import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
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
}
