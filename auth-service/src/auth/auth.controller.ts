import { Controller } from '@nestjs/common';
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
  ListUsersQuery,
  UpdateUserPayload,
  CreateUserPayload,
} from './dto/auth.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  /*
   * =========================================================================
   * User management handlers (previously users-service).
   * Command names match what api-gateway still sends via its /users endpoints.
   * =========================================================================
   */

  @MessagePattern({ cmd: 'users.health' })
  usersHealth() {
    return this.authService.health();
  }

  @MessagePattern({ cmd: 'users.list' })
  listUsers(@Payload() query: ListUsersQuery) {
    return this.authService.listUsers(query);
  }

  @MessagePattern({ cmd: 'users.profile' })
  userProfile(@Payload() data: { userId: string }) {
    return this.authService.getUserProfile(data.userId);
  }

  @MessagePattern({ cmd: 'users.get_by_id' })
  getUserById(@Payload() data: { userId: string }) {
    return this.authService.getUserById(data.userId);
  }

  @MessagePattern({ cmd: 'users.find_by_email' })
  findByEmail(@Payload() data: { email: string }) {
    return this.authService.findByEmail(data.email);
  }

  @MessagePattern({ cmd: 'users.create' })
  createUser(@Payload() data: { payload: CreateUserPayload }) {
    return this.authService.createUser(data.payload);
  }

  @MessagePattern({ cmd: 'users.update' })
  updateUser(@Payload() data: { userId: string; payload: UpdateUserPayload }) {
    return this.authService.updateUser(data.userId, data.payload);
  }

  @MessagePattern({ cmd: 'users.delete' })
  deleteUser(@Payload() data: { userId: string }) {
    return this.authService.deleteUser(data.userId);
  }
}
