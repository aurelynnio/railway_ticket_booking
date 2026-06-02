import { Injectable } from '@nestjs/common';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
} from './dto/auth.dto';
import { PrismaClient } from '@prisma/client';
import { comparePassword } from './utils/HashPassword.util';
import { TokenService } from './utils/GenerateToken.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
  ) {}
  health() {
    return {
      service: 'auth-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async register(payload: RegisterRequest) {
    if (!payload.email || !payload.password || !payload.username) {
      throw new Error('Missing required fields');
    }
    if (payload.email) {
      const existingUser: any = await this.prisma.authAccount.findUnique({
        where: { email: payload.email },
      });
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }
    const newUser: any = await this.prisma.authAccount.create({
      data: {
        email: payload.email,
        password: payload.password,
        username: payload.username,
      },
    });
    return newUser;
  }

  async login(payload: LoginRequest) {
    if (!payload.email || !payload.password) {
      throw new Error('Missing required fields');
    }
    const user: any = await this.prisma.authAccount.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isPasswordValid = await comparePassword(
      payload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });
    return {
      accessToken,
      refreshToken,
    };
  }
  async refreshToken(payload: RefreshTokenRequest) {
    if (!payload.refreshToken) {
      throw new Error('Missing refresh token');
    }
  }

  async forgotPassword(payload: ForgotPasswordRequest) {}

  async resetPassword(token: string, newPassword: string) {}
}
