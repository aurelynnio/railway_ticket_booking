import { Controller, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
} from './dto/auth.dto';
import { MessagePattern } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return this.authService.health();
  }

  @MessagePattern({ cmd: 'auth.register' })
  register(@Body() payload: RegisterRequest) {
    return this.authService.register(payload);
  }

  @MessagePattern({ cmd: 'auth.login' })
  login(@Body() payload: LoginRequest) {
    return this.authService.login(payload);
  }

  @MessagePattern({ cmd: 'auth.refreshToken' })
  refreshToken(@Body() payload: RefreshTokenRequest) {
    return this.authService.refreshToken(payload);
  }

  @MessagePattern({ cmd: 'auth.forgotPassword' })
  forgotPassword(@Body() email: ForgotPasswordRequest) {
    return this.authService.forgotPassword(email);
  }

  @MessagePattern({ cmd: 'auth.resetPassword' })
  resetPassword(@Body() data: { token: string; newPassword: string }) {
    return this.authService.resetPassword(data.token, data.newPassword);
  }
}
