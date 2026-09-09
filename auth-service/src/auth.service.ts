import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { createHash } from 'node:crypto';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  LogoutRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  SocialLoginGoogleRequest,
  ListUsersQuery,
  UpdateUserPayload,
  CreateUserPayload,
} from './dto/auth.dto';
import { PrismaClient } from '@prisma/client';
import { comparePassword, hashPassword } from './utils/auth.utils';
import { TokenService } from './utils/generate-token.utils';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokenService: TokenService,
    @Inject('notification_service')
    private readonly notificationClient: ClientProxy,
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

    const hashedPassword = await hashPassword(payload.password);
    let newUser;

    try {
      newUser = await this.prisma.authAccount.create({
        data: {
          email: payload.email,
          password: hashedPassword,
          username: payload.username,
          emailVerified: false,
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
    } catch (error) {
      // P2002 = unique constraint violation (email or username already taken)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Email or username already in use');
      }
      throw error;
    }

    try {
      const token = await this.generateAndStoreEmailVerificationToken(
        newUser.id,
        newUser.email,
      );

      this.emitNotification('notification.email_verification', {
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.username,
        token,
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate verification token: ${getErrorMessage(error)}`,
      );
    }

    this.emitNotification('notification.user_registered', {
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.username,
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

    if (!user.password) {
      // Same generic message as the wrong-password path so attackers cannot
      // probe which emails exist (e.g. Google-only accounts).
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
      tokenVersion: user.tokenVersion,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    await this.storeRefreshToken(refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(payload: RefreshTokenRequest) {
    if (!payload.refreshToken) {
      throw new BadRequestException('Missing refresh token');
    }

    const tokenPayload = await this.tokenService.verifyToken(
      payload.refreshToken,
    );
    await this.ensureRefreshTokenNotRevoked(payload.refreshToken);
    const user = await this.findActiveUserById(tokenPayload.userId);
    if (
      !user ||
      user.email !== tokenPayload.email ||
      (user.tokenVersion ?? 0) !== (tokenPayload.tokenVersion ?? 0)
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });
    await this.storeRefreshToken(refreshToken);

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
    if (
      !user ||
      user.email !== tokenPayload.email ||
      (user.tokenVersion ?? 0) !== (tokenPayload.tokenVersion ?? 0)
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /*
   * Revokes the presented refresh token so it can no longer be exchanged for
   * new credentials. Invalid, expired, or unknown tokens are treated as
   * already logged out — logout stays idempotent and never fails.
   */
  async logout(payload?: LogoutRequest) {
    const refreshToken = payload?.refreshToken?.trim();
    if (!refreshToken) {
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    try {
      await this.tokenService.verifyToken(refreshToken);
    } catch {
      // Invalid or expired tokens carry no session worth revoking.
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    try {
      await this.prisma.refreshToken.upsert({
        where: { tokenHash: this.hashToken(refreshToken) },
        update: { revokedAt: new Date() },
        create: {
          tokenHash: this.hashToken(refreshToken),
          revokedAt: new Date(),
          expiresAt: this.buildRefreshTokenExpiry(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh token on logout: ${getErrorMessage(error)}`,
      );
    }

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<{ success: boolean; message: string }> {
    if (!payload.email) {
      throw new BadRequestException('Missing email');
    }

    // Don't reveal whether email exists — return generic success either way
    const user = await this.findActiveUserByEmail(payload.email);
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a reset link has been sent.',
      };
    }

    const resetToken = await this.tokenService.generatePasswordResetToken({
      userId: user.id,
      email: user.email,
    });
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

    this.emitNotification('notification.password_reset', {
      userId: user.id,
      email: user.email,
      token: resetToken,
    });

    // Never return the raw token in the HTTP response — only via email
    return {
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    };
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

    const isSamePassword = resetToken.authAccount.password
      ? await comparePassword(
          payload.newPassword,
          resetToken.authAccount.password,
        )
      : false;
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

  /*
   * Refresh tokens are stored hashed so a database leak cannot be replayed.
   * Persistence failures are logged but never block token issuance — the
   * revocation table is best-effort state layered on top of the stateless
   * tokenVersion mechanism.
   */
  private async storeRefreshToken(refreshToken: string) {
    try {
      await this.prisma.refreshToken.create({
        data: {
          tokenHash: this.hashToken(refreshToken),
          expiresAt: this.buildRefreshTokenExpiry(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist refresh token: ${getErrorMessage(error)}`,
      );
    }
  }

  private async ensureRefreshTokenNotRevoked(refreshToken: string) {
    try {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: this.hashToken(refreshToken) },
      });
      if (stored?.revokedAt) {
        throw new UnauthorizedException('Invalid or expired token');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // A missing revocation table (pending migration) must not lock users out.
      this.logger.error(
        `Failed to check refresh token revocation: ${getErrorMessage(error)}`,
      );
    }
  }

  private buildRefreshTokenExpiry() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // matches refresh token TTL
  }

  async changePassword(userId: string, payload: ChangePasswordRequest) {
    if (!userId || !payload.newPassword) {
      throw new BadRequestException('Missing required fields');
    }
    const user = await this.findActiveUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.password) {
      if (!payload.oldPassword) {
        throw new BadRequestException('Missing current password');
      }
      const isCurrentPasswordValid = await comparePassword(
        payload.oldPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const newPasswordHash = await hashPassword(payload.newPassword);

    if (!newPasswordHash) {
      throw new BadRequestException('Failed to hash new password');
    }

    await this.prisma.authAccount.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async verifyEmail(payload: VerifyEmailRequest) {
    if (!payload.token) {
      throw new BadRequestException('Missing verification token');
    }

    const verifiedPayload = await this.tokenService.verifyToken(payload.token);
    const tokenHash = this.hashToken(payload.token);
    const verifyToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { authAccount: true },
    });

    if (
      !verifyToken ||
      verifyToken.expiresAt.getTime() <= Date.now() ||
      verifyToken.authAccount.deletedAt
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (
      verifyToken.authAccount.id !== verifiedPayload.userId ||
      verifyToken.authAccount.email !== verifiedPayload.email
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.prisma.$transaction([
      this.prisma.authAccount.update({
        where: { id: verifyToken.authAccount.id },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.delete({
        where: { userId: verifyToken.authAccount.id },
      }),
    ]);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async resendVerification(payload: ResendVerificationRequest) {
    if (!payload.email) {
      throw new BadRequestException('Missing email');
    }

    const user = await this.findActiveUserByEmail(payload.email);
    if (!user) {
      // Don't reveal whether email exists
      return {
        success: true,
        message: 'If the email exists and is unverified, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const token = await this.generateAndStoreEmailVerificationToken(
      user.id,
      user.email,
    );

    this.emitNotification('notification.email_verification', {
      userId: user.id,
      email: user.email,
      fullName: user.username,
      token,
    });

    // Never return the raw token in the HTTP response
    return {
      success: true,
      message: 'If the email exists and is unverified, a verification link has been sent.',
    };
  }

  socialLoginGoogle(payload: SocialLoginGoogleRequest): never {
    if (!payload.code) {
      throw new BadRequestException('Missing authorization code');
    }

    throw new BadRequestException(
      'Google OAuth is not yet implemented. Please use email/password login.',
    );
  }

  async revokeAllSessions(userId: string) {
    if (!userId) {
      throw new BadRequestException('Missing user ID');
    }

    const user = await this.findActiveUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.authAccount.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return {
      success: true,
      message: 'All sessions revoked successfully',
    };
  }

  /*
   * =========================================================================
   * User management (previously users-service).
   * All operations run on the AuthAccount table so identity and profile data
   * stay in a single source of truth, and secrets are never exposed.
   * =========================================================================
   */

  async listUsers(query: ListUsersQuery = {}) {
    const page = this.normalizePositiveInteger(query.page, 1);
    const limit = this.normalizePositiveInteger(query.limit, 10);
    const skip = (page - 1) * limit;

    const [total, users] = await this.prisma.$transaction([
      this.prisma.authAccount.count({
        where: { deletedAt: null },
      }),
      this.prisma.authAccount.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: users.map((user) => this.toPublicUser(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getUserProfile(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.findActiveUserById(userId);
    return user ? this.toPublicUser(user) : null;
  }

  async getUserById(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.findActiveUserById(userId);
    return user ? this.toPublicUser(user) : null;
  }

  async findByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.findActiveUserByEmail(email);
    return user ? this.toPublicUser(user) : null;
  }

  async createUser(payload: CreateUserPayload) {
    if (!payload.username || !payload.email || !payload.password) {
      throw new BadRequestException('Username, email and password are required');
    }

    // Hash on creation so plaintext passwords never reach the database.
    const hashedPassword = await hashPassword(payload.password);

    try {
      const user = await this.prisma.authAccount.create({
        data: {
          username: payload.username,
          email: payload.email,
          password: hashedPassword,
          role: payload.role ?? 0,
          emailVerified: false,
        },
      });
      return this.toPublicUser(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email or username already in use');
      }
      throw error;
    }
  }

  async updateUser(userId: string, payload: UpdateUserPayload) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.findActiveUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const updated = await this.prisma.authAccount.update({
        where: { id: userId },
        data: {
          ...(payload.username !== undefined
            ? { username: payload.username }
            : {}),
          ...(payload.email !== undefined ? { email: payload.email } : {}),
          ...(payload.role !== undefined ? { role: payload.role } : {}),
        },
      });
      return this.toPublicUser(updated);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email or username already in use');
      }
      throw error;
    }
  }

  async deleteUser(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.findActiveUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.authAccount.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    return { message: `User with ID ${userId} has been deleted` };
  }

  private toPublicUser(user: {
    id: string;
    username: string;
    email: string;
    role: number;
    emailVerified: boolean;
    googleId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      googleId: user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }

  private normalizePositiveInteger(
    value: number | string | undefined,
    fallback: number,
  ) {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  }

  private async generateAndStoreEmailVerificationToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const token = await this.tokenService.generateEmailVerificationToken({
      userId,
      email,
    });
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.upsert({
      where: { userId },
      update: {
        tokenHash,
        expiresAt,
      },
      create: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  private emitNotification(pattern: string, payload: unknown): void {
    this.notificationClient.emit(pattern, payload).subscribe({
      error: (error: unknown) => {
        this.logger.error(
          `Failed to emit ${pattern}: ${getErrorMessage(error)}`,
        );
      },
    });
  }
}
