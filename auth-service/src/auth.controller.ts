import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  LogoutRequest,
  ResetPasswordRequest,
  ValidateTokenRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  SocialLoginGoogleRequest,
} from './dto/auth.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return this.authService.health();
  }

  @MessagePattern({ cmd: 'auth.health' })
  healthMessage() {
    return this.authService.health();
  }

  @MessagePattern({ cmd: 'auth.register' })
  register(@Payload() payload: RegisterRequest) {
    return this.authService.register(payload);
  }

  @MessagePattern({ cmd: 'auth.login' })
  login(@Payload() payload: LoginRequest) {
    return this.authService.login(payload);
  }

  @MessagePattern({ cmd: 'auth.refreshToken' })
  refreshToken(@Payload() payload: RefreshTokenRequest) {
    return this.authService.refreshToken(payload);
  }

  @MessagePattern({ cmd: 'auth.validate_token' })
  validateToken(@Payload() payload: ValidateTokenRequest) {
    return this.authService.validateToken(payload.token);
  }

  @MessagePattern({ cmd: 'auth.logout' })
  logout(@Payload() payload: LogoutRequest) {
    return this.authService.logout(payload);
  }

  @MessagePattern({ cmd: 'auth.forgotPassword' })
  forgotPassword(@Payload() email: ForgotPasswordRequest) {
    return this.authService.forgotPassword(email);
  }

  @MessagePattern({ cmd: 'auth.resetPassword' })
  resetPassword(@Payload() payload: ResetPasswordRequest) {
    return this.authService.resetPassword(payload);
  }

  @MessagePattern({ cmd: 'auth.changePassword' })
  changePassword(
    @Payload() payload: { userId: string; data: ChangePasswordRequest },
  ) {
    return this.authService.changePassword(payload.userId, payload.data);
  }

  @MessagePattern({ cmd: 'auth.verifyEmail' })
  verifyEmail(@Payload() payload: VerifyEmailRequest) {
    return this.authService.verifyEmail(payload);
  }

  @MessagePattern({ cmd: 'auth.resendVerification' })
  resendVerification(@Payload() payload: ResendVerificationRequest) {
    return this.authService.resendVerification(payload);
  }

  @MessagePattern({ cmd: 'auth.socialLoginGoogle' })
  socialLoginGoogle(@Payload() payload: SocialLoginGoogleRequest) {
    return this.authService.socialLoginGoogle(payload);
  }

  @MessagePattern({ cmd: 'auth.revokeAllSessions' })
  revokeAllSessions(@Payload() payload: { userId: string }) {
    return this.authService.revokeAllSessions(payload.userId);
  }
}
