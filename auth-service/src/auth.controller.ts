import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health() {
    return this.authService.health();
  }

  @Post('register')
  register(@Body() payload: RegisterRequest) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginRequest) {
    return this.authService.login(payload);
  }

  @Post('refresh-token')
  refreshToken(@Body() payload: RefreshTokenRequest) {
    return this.authService.refreshToken(payload);
  }
}
