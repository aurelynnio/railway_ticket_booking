import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
} from './auth.dto';
import { Public } from '../common/decorator/public.decorator';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
} from './auth.constants';
import type { Request, Response, CookieOptions } from 'express';
import { firstValueFrom } from 'rxjs';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../common/interfaces/request-user.interface';

type CookieRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  @Public()
  health() {
    return this.authService.health();
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await firstValueFrom(this.authService.login(loginDto));

    this.setAuthCookies(response, authResult);

    return {
      success: true,
    };
  }

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  register(@Body() registerDto: RegisterRequest) {
    return this.authService.register(registerDto);
  }

  @Post(['refresh-token', 'refreshToken'])
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async refreshToken(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token cookie');
    }

    const authResult = await firstValueFrom(
      this.authService.refreshToken({ refreshToken }),
    );

    this.setAuthCookies(response, authResult);

    return {
      success: true,
    };
  }

  @Post('logout')
  @Public()
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    const logoutDto: LogoutRequest = refreshToken ? { refreshToken } : {};
    const result = await firstValueFrom(this.authService.logout(logoutDto));

    this.clearAuthCookies(response);

    return result;
  }

  @Get('session')
  session(
    @Req()
    request: {
      user?: { userId?: string; email?: string; role?: number };
    },
  ) {
    return {
      userId: request.user?.userId ?? '',
      email: request.user?.email ?? '',
      role: request.user?.role,
    };
  }

  @Post('forgot-password')
  @Post('forgotPassword')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequest) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @Post('resetPassword')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() resetPasswordDto: ResetPasswordRequest) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @Post('changePassword')
  changePassword(
    @Req() request: { user?: RequestUser },
    @Body() changePasswordDto: ChangePasswordRequest,
  ) {
    const userId = request.user?.userId ?? '';
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('verify-email')
  @Post('verifyEmail')
  @Public()
  verifyEmail(@Body() verifyEmailDto: VerifyEmailRequest) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @Post('resendVerification')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resendVerification(@Body() resendDto: ResendVerificationRequest) {
    return this.authService.resendVerification(resendDto);
  }

  @Get('google')
  @Public()
  googleLogin(): never {
    throw new NotImplementedException(
      'Google OAuth is not available in this deployment yet.',
    );
  }

  @Get('google/callback')
  @Public()
  async googleCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!code) {
      throw new UnauthorizedException('Authorization code missing');
    }
    const authResult = await firstValueFrom(
      this.authService.socialLoginGoogle({ code }),
    );

    this.setAuthCookies(response, authResult);

    return {
      success: true,
      message: 'Google login successful',
    };
  }

  @Post('revoke-all-sessions')
  @Post('revokeAllSessions')
  revokeAllSessions(@Req() request: { user?: RequestUser }) {
    const userId = request.user?.userId ?? '';
    return this.authService.revokeAllSessions(userId);
  }

  private setAuthCookies(
    response: Response,
    authResult: { accessToken: string; refreshToken: string },
  ) {
    response.cookie(
      ACCESS_TOKEN_COOKIE_NAME,
      authResult.accessToken,
      this.buildCookieOptions(ACCESS_TOKEN_MAX_AGE_MS),
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      authResult.refreshToken,
      this.buildCookieOptions(REFRESH_TOKEN_MAX_AGE_MS),
    );
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, this.buildCookieOptions());
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, this.buildCookieOptions());
  }

  private buildCookieOptions(maxAge?: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
    };
  }
}
