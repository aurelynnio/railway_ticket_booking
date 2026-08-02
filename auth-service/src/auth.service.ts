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
} from './dto/auth.dto';
import { PrismaClient } from '@prisma/client';
import { comparePassword, hashPassword } from './utils/hash-password.util';
import { TokenService } from './utils/generate-token.util';

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
      await this.generateAndStoreEmailVerificationToken(
        newUser.id,
        newUser.email,
      );
    } catch (error) {
      this.logger.error(`Failed to generate verification token: ${error}`);
    }

    try {
      this.notificationClient.emit('notification.user_registered', {
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.username,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification.user_registered event: ${error}`,
      );
    }

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
      throw new UnauthorizedException('This account uses Google Login');
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

  logout(payload?: LogoutRequest) {
    void payload;
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

    try {
      this.notificationClient.emit('notification.password_reset', {
        userId: user.id,
        email: user.email,
        token: resetToken,
      });
    } catch (error) {
      this.logger.error(`Failed to emit notification.password_reset event: ${error}`);
    }

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

    // Emit event for notification-service to send the email
    try {
      this.notificationClient.emit('notification.user_registered', {
        userId: user.id,
        email: user.email,
        fullName: user.username,
      });
    } catch (error) {
      this.logger.error(`Failed to emit verification email event: ${error}`);
    }

    // Never return the raw token in the HTTP response
    return {
      success: true,
      message: 'If the email exists and is unverified, a verification link has been sent.',
    };
  }

  async socialLoginGoogle(payload: SocialLoginGoogleRequest) {
    if (!payload.code) {
      throw new BadRequestException('Missing authorization code');
    }

    // Disable Google login if not properly configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new BadRequestException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID environment variable.',
      );
    }

    // TODO: Implement real Google OAuth code exchange:
    // 1. Exchange authorization code for access token via Google API
    // 2. Fetch user profile from Google userinfo endpoint
    // 3. Find or create user based on google_id
    // The previous implementation was a security hole — it accepted any code
    // and created a fake user with google_id_<code>.
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

  sendEmail(to: string, subject: string, text: string): void {
    // Stub: real email sending is handled by notification-service via RabbitMQ events
    this.logger.warn(`Email stub called directly — use notification events instead. To: ${to}, Subject: ${subject}`);
  }
}
