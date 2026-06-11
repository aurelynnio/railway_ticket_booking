import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  LogoutRequest,
  ResetPasswordRequest,
} from './dto/auth.dto';
import { PrismaClient } from '@prisma/client';
import { comparePassword, hashPassword } from './utils/hash-password.util';
import { TokenService } from './utils/generate-token.util';

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

  /*
   * Registration first guards required identity fields, then persists only
   * the hashed password so raw credentials never reach storage.
   */
  async register(payload: RegisterRequest) {
    if (!payload.email || !payload.password || !payload.username) {
      throw new BadRequestException('Missing required fields');
    }

    const existingUser = await this.prisma.authAccount.findUnique({
      where: { email: payload.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await hashPassword(payload.password);
    const newUser = await this.prisma.authAccount.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        username: payload.username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newUser;
  }

  async login(payload: LoginRequest) {
    if (!payload.email || !payload.password) {
      throw new BadRequestException('Missing required fields');
    }

    const user = await this.findActiveUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(
      payload.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    /*
     * Token issuance happens only after the active account and password are
     * both verified, keeping access and refresh tokens in the same trust path.
     */
    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(payload: RefreshTokenRequest) {
    if (!payload.refreshToken) {
      throw new BadRequestException('Missing refresh token');
    }

    const tokenPayload = await this.tokenService.verifyToken(payload.refreshToken);
    const user = await this.findActiveUserById(tokenPayload.userId);
    if (!user || user.email !== tokenPayload.email) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateToken(token: string) {
    if (!token) {
      throw new BadRequestException('Missing token');
    }

    const tokenPayload = await this.tokenService.verifyToken(token);
    const user = await this.findActiveUserById(tokenPayload.userId);
    if (!user || user.email !== tokenPayload.email) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async logout(_payload?: LogoutRequest) {
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<string> {
    if (!payload.email) {
      throw new BadRequestException('Missing email');
    }

    const user = await this.findActiveUserByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('Email not found');
    }

    const resetToken = await this.tokenService.generatePasswordResetToken(
      {
        userId: user.id,
        email: user.email,
      },
    );
    if (!resetToken) {
      throw new BadRequestException('Failed to generate reset token');
    }

    /*
     * Store only a hash of the reset token and rotate its expiry on upsert
     * so the database never keeps the raw recovery secret.
     */
    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash: this.hashToken(resetToken),
        expiresAt: this.buildPasswordResetExpiry(),
      },
      create: {
        userId: user.id,
        tokenHash: this.hashToken(resetToken),
        expiresAt: this.buildPasswordResetExpiry(),
      },
    });

    return resetToken;
  }

  async resetPassword(payload: ResetPasswordRequest) {
    if (!payload.token || !payload.newPassword) {
      throw new BadRequestException('Missing token or new password');
    }

    /*
     * Password reset cross-checks the signed token against the stored hash
     * and account state before replacing credentials inside one transaction.
     */
    const verifiedPayload = await this.tokenService.verifyToken(payload.token);
    const tokenHash = this.hashToken(payload.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        authAccount: true,
      },
    });

    if (
      !resetToken ||
      resetToken.expiresAt.getTime() <= Date.now() ||
      resetToken.authAccount.deletedAt
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (
      resetToken.authAccount.id !== verifiedPayload.userId ||
      resetToken.authAccount.email !== verifiedPayload.email
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const isSamePassword = await comparePassword(
      payload.newPassword,
      resetToken.authAccount.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as the old password',
      );
    }

    const hashedPassword = await hashPassword(payload.newPassword);

    await this.prisma.$transaction([
      this.prisma.authAccount.update({
        where: { id: resetToken.authAccount.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.delete({
        where: { userId: resetToken.authAccount.id },
      }),
    ]);

    return {
      success: true,
      message: 'Password reset successful',
    };
  }

  private findActiveUserByEmail(email: string) {
    return this.prisma.authAccount.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  private findActiveUserById(id: string) {
    return this.prisma.authAccount.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildPasswordResetExpiry() {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}
