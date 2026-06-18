import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  SocialLoginGoogleRequest,
} from '../common/dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
} from './auth.constants';
import type { Request, Response, CookieOptions } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = (await firstValueFrom(
      this.authService.login(loginDto),
    )) as {
      accessToken: string;
      refreshToken: string;
    };

    this.setAuthCookies(response, authResult);

    return {
      success: true,
    };
  }

  @Post('register')
  register(@Body() registerDto: RegisterRequest) {
    return this.authService.register(registerDto);
  }

  @Post('refreshToken')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token cookie');
    }

    const authResult = (await firstValueFrom(
      this.authService.refreshToken({ refreshToken }),
    )) as {
      accessToken: string;
      refreshToken: string;
    };

    this.setAuthCookies(response, authResult);

    return {
      success: true,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    const logoutDto: LogoutRequest = refreshToken ? { refreshToken } : {};
    const result = await firstValueFrom(this.authService.logout(logoutDto));

    this.clearAuthCookies(response);

    return result;
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
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

  @Post('forgotPassword')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequest) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('resetPassword')
  resetPassword(@Body() resetPasswordDto: ResetPasswordRequest) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('changePassword')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() request: { user?: { userId?: string } },
    @Body() changePasswordDto: ChangePasswordRequest,
  ) {
    const userId = request.user?.userId ?? '';
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('verifyEmail')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailRequest) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resendVerification')
  resendVerification(@Body() resendDto: ResendVerificationRequest) {
    return this.authService.resendVerification(resendDto);
  }

  @Get('google')
  googleLogin(@Res() res: Response) {
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=MOCK_CLIENT_ID&redirect_uri=http://localhost:3000/auth/google/callback&response_type=code&scope=email%20profile`;
    res.redirect(redirectUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!code) {
      throw new UnauthorizedException('Authorization code missing');
    }
    const authResult = (await firstValueFrom(
      this.authService.socialLoginGoogle({ code }),
    )) as {
      accessToken: string;
      refreshToken: string;
    };

    this.setAuthCookies(response, authResult);

    return {
      success: true,
      message: 'Google login successful',
    };
  }

  @Post('revokeAllSessions')
  @UseGuards(JwtAuthGuard)
  revokeAllSessions(@Req() request: { user?: { userId?: string } }) {
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
