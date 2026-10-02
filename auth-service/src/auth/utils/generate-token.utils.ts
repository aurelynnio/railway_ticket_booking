import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Distinguishes the purposes a signed token can be used for.
 *
 * Every token is signed with the same key, so without an explicit type claim a
 * long-lived refresh token would satisfy the access-token check (and vice
 * versa), which silently extends the real session lifetime from 15 minutes to
 * 7 days.
 */
export type TokenType =
  | 'access'
  | 'refresh'
  | 'password_reset'
  | 'email_verification';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role?: number;
  tokenVersion?: number;
  typ?: TokenType;
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
        typ: 'access' satisfies TokenType,
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
        typ: 'refresh' satisfies TokenType,
      },
      { expiresIn: '7d' },
    );
  }

  /**
   * Verifies the signature/expiry and, when `expectedType` is given, that the
   * token was minted for that exact purpose.
   *
   * Tokens issued before the `typ` claim existed are rejected: accepting them
   * would reintroduce the type confusion this check exists to prevent. Callers
   * should expect a one-time re-login after deploying this change.
   */
  async verifyToken(
    token: string,
    expectedType?: TokenType,
  ): Promise<AuthTokenPayload> {
    let payload: AuthTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (expectedType && payload.typ !== expectedType) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return payload;
  }

  generatePasswordResetToken(
    payload: Pick<AuthTokenPayload, 'userId' | 'email'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
        typ: 'password_reset' satisfies TokenType,
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
        typ: 'email_verification' satisfies TokenType,
      },
      { expiresIn: '24h' },
    );
  }
}
