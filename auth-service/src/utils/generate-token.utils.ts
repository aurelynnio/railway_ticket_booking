import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role?: number;
  tokenVersion?: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: AuthTokenPayload): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tokenVersion: payload.tokenVersion ?? 0,
      },
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(payload: AuthTokenPayload): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tokenVersion: payload.tokenVersion ?? 0,
      },
      { expiresIn: '7d' },
    );
  }

  async verifyToken(token: string): Promise<AuthTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AuthTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  generatePasswordResetToken(
    payload: Pick<AuthTokenPayload, 'userId' | 'email'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
      },
      { expiresIn: '1h' },
    );
  }

  generateEmailVerificationToken(
    payload: Pick<AuthTokenPayload, 'userId' | 'email'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
      },
      { expiresIn: '24h' },
    );
  }
}

