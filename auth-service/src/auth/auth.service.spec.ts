jest.mock('./utils/auth.utils', () => ({
  hashPassword: jest.fn(async (password: string) => `hashed:${password}`),
  comparePassword: jest.fn(
    async (password: string, hashed: string) => hashed === `hashed:${password}`,
  ),
}));
jest.mock('./utils/generate-token.utils', () => ({
  TokenService: jest.fn().mockImplementation(() => ({
    generateAccessToken: jest.fn(() => 'mock-access-token'),
    generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  })),
}));

import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { EMPTY } from 'rxjs';
import { comparePassword, hashPassword } from './utils/auth.utils';
import { AuthService } from './auth.service';
import { TokenService } from './utils/generate-token.utils';
import { DrizzleService } from '../drizzle/drizzle.service';
import {
  authAccounts,
  emailVerificationTokens,
  passwordResetTokens,
  refreshTokens,
} from '../drizzle/schema';

describe('AuthService', () => {
  let service: AuthService;
  let dbMock: {
    query: {
      authAccounts: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
      };
      passwordResetTokens: {
        findFirst: jest.Mock;
      };
      emailVerificationTokens: {
        findFirst: jest.Mock;
      };
      refreshTokens: {
        findFirst: jest.Mock;
      };
    };
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    select: jest.Mock;
    transaction: jest.Mock;
    // Helper spies for assertions
    insertValuesSpy: jest.Mock;
    insertReturningSpy: jest.Mock;
    onConflictDoUpdateSpy: jest.Mock;
    updateSetSpy: jest.Mock;
    updateWhereSpy: jest.Mock;
    updateReturningSpy: jest.Mock;
    deleteWhereSpy: jest.Mock;
  };
  let tokenService: {
    generateAccessToken: jest.Mock;
    generateRefreshToken: jest.Mock;
    verifyToken: jest.Mock;
    generatePasswordResetToken: jest.Mock;
    generateEmailVerificationToken: jest.Mock;
  };

  beforeEach(() => {
    const insertReturningSpy = jest.fn().mockResolvedValue([]);
    const onConflictDoUpdateSpy = jest.fn().mockResolvedValue([]);
    const insertValuesSpy = jest.fn().mockImplementation(() => ({
      returning: insertReturningSpy,
      onConflictDoUpdate: onConflictDoUpdateSpy,
    }));

    const updateReturningSpy = jest.fn().mockResolvedValue([{ tokenVersion: 1 }]);
    const updateWhereSpy = jest.fn().mockImplementation(() => {
      const promise = Promise.resolve([]);
      return Object.assign(promise, {
        returning: updateReturningSpy,
      });
    });
    const updateSetSpy = jest.fn().mockImplementation(() => ({
      where: updateWhereSpy,
    }));

    const deleteWhereSpy = jest.fn().mockResolvedValue([]);

    dbMock = {
      query: {
        authAccounts: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        passwordResetTokens: {
          findFirst: jest.fn(),
        },
        emailVerificationTokens: {
          findFirst: jest.fn(),
        },
        refreshTokens: {
          findFirst: jest.fn(),
        },
      },
      insert: jest.fn().mockImplementation(() => ({
        values: insertValuesSpy,
      })),
      update: jest.fn().mockImplementation(() => ({
        set: updateSetSpy,
      })),
      delete: jest.fn().mockImplementation(() => ({
        where: deleteWhereSpy,
      })),
      select: jest.fn(),
      transaction: jest.fn().mockImplementation(async (cb) => cb(dbMock)),
      insertValuesSpy,
      insertReturningSpy,
      onConflictDoUpdateSpy,
      updateSetSpy,
      updateWhereSpy,
      updateReturningSpy,
      deleteWhereSpy,
    };

    tokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
      generatePasswordResetToken: jest.fn(),
      generateEmailVerificationToken: jest.fn(),
    };

    const notificationClient = {
      emit: jest.fn(() => EMPTY),
    };

    service = new AuthService(
      { db: dbMock } as unknown as DrizzleService,
      tokenService as unknown as TokenService,
      notificationClient as unknown as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('register should hash the password before persisting the account', async () => {
    (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
    tokenService.generateEmailVerificationToken.mockResolvedValue('verify-token');
    dbMock.insertReturningSpy.mockResolvedValueOnce([
      {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        avatar: null,
        role: 0,
        createdAt: new Date('2026-06-12T08:00:00.000Z'),
        updatedAt: new Date('2026-06-12T08:00:00.000Z'),
      },
    ]);

    const result = await service.register({
      email: 'alice@example.com',
      password: 'secret123',
      username: 'alice',
    });

    expect(hashPassword).toHaveBeenCalledWith('secret123');
    expect(dbMock.insert).toHaveBeenCalledWith(authAccounts);
    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'hashed-password',
      username: 'alice',
      avatar: null,
      emailVerified: false,
    });
    expect(result.email).toBe('alice@example.com');
  });

  it('register should reject duplicate emails', async () => {
    dbMock.insertReturningSpy.mockRejectedValueOnce({ code: '23505' });

    await expect(
      service.register({
        email: 'alice@example.com',
        password: 'secret123',
        username: 'alice',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('login should validate credentials and mint access and refresh tokens', async () => {
    dbMock.query.authAccounts.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      password: 'hashed-password',
      role: 1,
      deletedAt: null,
    });
    (comparePassword as jest.Mock).mockResolvedValue(true);
    tokenService.generateAccessToken.mockResolvedValue('access-token');
    tokenService.generateRefreshToken.mockResolvedValue('refresh-token');

    const result = await service.login({
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(comparePassword).toHaveBeenCalledWith(
      'secret123',
      'hashed-password',
    );
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      userId: 'user-1',
      email: 'alice@example.com',
      role: 1,
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('refreshToken should verify the token and re-issue credentials', async () => {
    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    dbMock.query.authAccounts.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      role: 1,
      deletedAt: null,
    });
    tokenService.generateAccessToken.mockResolvedValue('new-access-token');
    tokenService.generateRefreshToken.mockResolvedValue('new-refresh-token');

    const result = await service.refreshToken({
      refreshToken: 'refresh-token',
    });

    expect(tokenService.verifyToken).toHaveBeenCalledWith(
      'refresh-token',
      'refresh',
    );
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('refreshToken should revoke the presented token when rotating it', async () => {
    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    dbMock.query.authAccounts.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      role: 1,
      deletedAt: null,
    });
    tokenService.generateAccessToken.mockResolvedValue('new-access-token');
    tokenService.generateRefreshToken.mockResolvedValue('new-refresh-token');
    dbMock.onConflictDoUpdateSpy.mockResolvedValue([{ id: 'token-1' }]);

    await service.refreshToken({ refreshToken: 'refresh-token' });

    const expectedHash = createHash('sha256')
      .update('refresh-token')
      .digest('hex');

    // Rotation: the exchanged token must be marked revoked, otherwise a stolen
    // refresh token stays usable for its whole 7-day lifetime.
    expect(dbMock.insert).toHaveBeenCalledWith(refreshTokens);
    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: expectedHash,
        revokedAt: expect.any(Date),
      }),
    );
    expect(dbMock.onConflictDoUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('refreshToken should keep the client signed in when two refreshes land in the same second', async () => {
    const rows = new Map<
      string,
      { tokenHash: string; revokedAt: Date | null; expiresAt: Date }
    >();
    const tokenHash = createHash('sha256')
      .update('same-second-token')
      .digest('hex');

    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    dbMock.query.authAccounts.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      role: 1,
      deletedAt: null,
    });
    tokenService.generateAccessToken.mockResolvedValue(
      'same-second-access-token',
    );
    tokenService.generateRefreshToken.mockResolvedValue('same-second-token');

    dbMock.insertValuesSpy.mockImplementation(
      (values: {
        tokenHash: string;
        revokedAt?: Date | null;
        expiresAt: Date;
      }) => ({
        onConflictDoUpdate: jest.fn().mockImplementation(
          async ({
            set,
          }: {
            set: { revokedAt: Date | null; expiresAt?: Date };
          }) => {
            const existing = rows.get(values.tokenHash);
            if (existing) {
              return Object.assign(existing, set);
            }
            const created = {
              ...values,
              revokedAt: values.revokedAt ?? null,
            };
            rows.set(values.tokenHash, created);
            return created;
          },
        ),
      }),
    );
    dbMock.query.refreshTokens.findFirst.mockImplementation(async () =>
      rows.get(tokenHash) ?? null,
    );

    await service.refreshToken({ refreshToken: 'same-second-token' });
    const secondRefresh = await service.refreshToken({
      refreshToken: 'same-second-token',
    });

    expect(secondRefresh).toEqual({
      accessToken: 'same-second-access-token',
      refreshToken: 'same-second-token',
    });
    expect(rows.get(tokenHash)?.revokedAt).toBeNull();
  });

  it('logout should revoke the presented refresh token and return success', async () => {
    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    dbMock.onConflictDoUpdateSpy.mockResolvedValue([{ id: 'token-1' }]);

    const result = await service.logout({ refreshToken: 'refresh-token' });

    const expectedHash = createHash('sha256')
      .update('refresh-token')
      .digest('hex');

    expect(tokenService.verifyToken).toHaveBeenCalledWith(
      'refresh-token',
      'refresh',
    );
    expect(dbMock.insert).toHaveBeenCalledWith(refreshTokens);
    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: expectedHash,
        revokedAt: expect.any(Date),
        expiresAt: expect.any(Date),
      }),
    );
    expect(dbMock.onConflictDoUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'Logout successful',
    });
  });

  it('logout should still succeed when the token is invalid or revocation fails', async () => {
    tokenService.verifyToken.mockRejectedValue(
      new UnauthorizedException('Invalid or expired token'),
    );

    const result = await service.logout({ refreshToken: 'bad-token' });

    expect(dbMock.onConflictDoUpdateSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Logout successful',
    });
  });

  it('forgotPassword should persist only the token hash and return a neutral response', async () => {
    dbMock.query.authAccounts.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      deletedAt: null,
    });
    tokenService.generatePasswordResetToken.mockResolvedValue('reset-token');

    const result = await service.forgotPassword({
      email: 'alice@example.com',
    });

    const tokenHash = createHash('sha256').update('reset-token').digest('hex');

    expect(dbMock.insert).toHaveBeenCalledWith(passwordResetTokens);
    expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenHash,
        expiresAt: expect.any(Date),
      }),
    );
    expect(dbMock.onConflictDoUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          tokenHash,
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    });
  });

  it('resetPassword should replace the password and delete the reset token record', async () => {
    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    dbMock.query.passwordResetTokens.findFirst.mockResolvedValue({
      userId: 'user-1',
      tokenHash: createHash('sha256').update('reset-token').digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      authAccount: {
        id: 'user-1',
        email: 'alice@example.com',
        password: 'old-hash',
        deletedAt: null,
      },
    });
    (comparePassword as jest.Mock).mockResolvedValue(false);
    (hashPassword as jest.Mock).mockResolvedValue('new-hash');

    const result = await service.resetPassword({
      token: 'reset-token',
      newPassword: 'new-secret',
    });

    expect(tokenService.verifyToken).toHaveBeenCalledWith(
      'reset-token',
      'password_reset',
    );
    expect(comparePassword).toHaveBeenCalledWith('new-secret', 'old-hash');
    expect(hashPassword).toHaveBeenCalledWith('new-secret');
    // A password reset must also bump tokenVersion so every session that
    // existed before the reset stops working.
    expect(dbMock.update).toHaveBeenCalledWith(authAccounts);
    expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'new-hash',
        tokenVersion: expect.anything(),
      }),
    );
    expect(dbMock.delete).toHaveBeenCalledWith(passwordResetTokens);
    expect(result).toEqual({
      success: true,
      message: 'Password reset successful',
    });
  });

  it('validateToken should reject mismatched active users', async () => {
    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    dbMock.query.authAccounts.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'someone-else@example.com',
      role: 0,
      deletedAt: null,
    });

    await expect(service.validateToken('access-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('login should reject missing fields', async () => {
    await expect(
      service.login({
        email: '',
        password: '',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  describe('changePassword', () => {
    it('should change password successfully when current password matches', async () => {
      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        role: 0,
        password: 'old-hashed-password',
      });
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (hashPassword as jest.Mock).mockResolvedValue('new-hashed-password');
      dbMock.updateReturningSpy.mockResolvedValue([{ tokenVersion: 2 }]);

      const result = await service.changePassword('user-1', {
        oldPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(comparePassword).toHaveBeenCalledWith(
        'old-password',
        'old-hashed-password',
      );
      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(dbMock.update).toHaveBeenCalledWith(authAccounts);
      expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new-hashed-password' }),
      );
      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully',
        accessToken: undefined,
        refreshToken: undefined,
      });
    });

    it('should throw UnauthorizedException when oldPassword does not match', async () => {
      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        password: 'old-hashed-password',
      });
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          oldPassword: 'wrong-password',
          newPassword: 'new-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow setting password without oldPassword if user has no current password (Google user)', async () => {
      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        role: 0,
        password: null,
      });
      (hashPassword as jest.Mock).mockResolvedValue('new-hashed-password');
      dbMock.updateReturningSpy.mockResolvedValue([{ tokenVersion: 1 }]);

      const result = await service.changePassword('user-1', {
        newPassword: 'new-password',
      });

      expect(comparePassword).not.toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(dbMock.update).toHaveBeenCalledWith(authAccounts);
      expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new-hashed-password' }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully and delete verification token', async () => {
      tokenService.verifyToken.mockResolvedValue({
        userId: 'user-1',
        email: 'alice@example.com',
      });
      dbMock.query.emailVerificationTokens.findFirst.mockResolvedValue({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 60_000),
        authAccount: {
          id: 'user-1',
          email: 'alice@example.com',
          deletedAt: null,
        },
      });

      const result = await service.verifyEmail({ token: 'verify-token' });

      expect(dbMock.update).toHaveBeenCalledWith(authAccounts);
      expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({ emailVerified: true }),
      );
      expect(dbMock.delete).toHaveBeenCalledWith(emailVerificationTokens);
      expect(result.success).toBe(true);
    });

    it('should throw UnauthorizedException if verification token is expired', async () => {
      tokenService.verifyToken.mockResolvedValue({
        userId: 'user-1',
        email: 'alice@example.com',
      });
      dbMock.query.emailVerificationTokens.findFirst.mockResolvedValue({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() - 60_000), // expired
        authAccount: {
          id: 'user-1',
          email: 'alice@example.com',
          deletedAt: null,
        },
      });

      await expect(
        service.verifyEmail({ token: 'verify-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resendVerification', () => {
    it('should generate new token and resend email if email is not verified', async () => {
      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        emailVerified: false,
      });
      tokenService.generateEmailVerificationToken.mockResolvedValue('new-token');
      dbMock.onConflictDoUpdateSpy.mockResolvedValue([{ userId: 'user-1' }]);

      const result = await service.resendVerification({
        email: 'alice@example.com',
      });

      expect(tokenService.generateEmailVerificationToken).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'alice@example.com',
      });
      expect(dbMock.insert).toHaveBeenCalledWith(emailVerificationTokens);
      expect(dbMock.onConflictDoUpdateSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result).not.toHaveProperty('token');
    });

    it('should return an identical response for a verified email (no enumeration)', async () => {
      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        emailVerified: true,
      });

      const verified = await service.resendVerification({
        email: 'alice@example.com',
      });

      // A verified address used to produce a 400 while an unknown address
      // produced a 200, which let anyone enumerate registered accounts.
      dbMock.query.authAccounts.findFirst.mockResolvedValue(null);
      const unknown = await service.resendVerification({
        email: 'nobody@example.com',
      });

      expect(verified).toEqual(unknown);
      expect(tokenService.generateEmailVerificationToken).not.toHaveBeenCalled();
    });
  });

  describe('socialLoginGoogle', () => {
    it('rejects a Google authorization code until the real exchange is implemented', () => {
      expect(() => service.socialLoginGoogle({ code: 'google-user' })).toThrow(
        BadRequestException,
      );
    });
  });

  describe('revokeAllSessions', () => {
    it('should increment tokenVersion of the user to invalidate all active tokens', async () => {
      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        tokenVersion: 1,
      });
      dbMock.updateReturningSpy.mockResolvedValue([{ tokenVersion: 2 }]);

      const result = await service.revokeAllSessions('user-1');

      expect(dbMock.update).toHaveBeenCalledWith(authAccounts);
      expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenVersion: expect.anything(),
        }),
      );
      expect(result).toEqual({
        success: true,
        message: 'All sessions revoked successfully',
      });
    });
  });

  describe('user avatar support', () => {
    it('should persist trimmed avatar on register and expose it on profile/update', async () => {
      const now = new Date('2026-06-12T08:00:00.000Z');
      (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
      tokenService.generateEmailVerificationToken.mockResolvedValue(
        'verify-token',
      );
      dbMock.insertReturningSpy.mockResolvedValueOnce([
        {
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          avatar: 'https://images.example.com/avatars/alice.png',
          role: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const registered = await service.register({
        email: 'alice@example.com',
        password: 'secret123',
        username: 'alice',
        avatar: '  https://images.example.com/avatars/alice.png  ',
      });

      expect(dbMock.insertValuesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar: 'https://images.example.com/avatars/alice.png',
        }),
      );
      expect(registered.avatar).toBe(
        'https://images.example.com/avatars/alice.png',
      );

      dbMock.query.authAccounts.findFirst.mockResolvedValue({
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        avatar: 'https://images.example.com/avatars/alice.png',
        role: 0,
        emailVerified: true,
        googleId: null,
        createdAt: now,
        updatedAt: now,
      });
      dbMock.updateReturningSpy.mockResolvedValueOnce([
        {
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          avatar: 'https://images.example.com/avatars/alice-v2.png',
          role: 0,
          emailVerified: true,
          googleId: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const updated = await service.updateUser('user-1', {
        avatar: ' https://images.example.com/avatars/alice-v2.png ',
      });

      expect(dbMock.updateSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar: 'https://images.example.com/avatars/alice-v2.png',
        }),
      );
      expect(updated.avatar).toBe(
        'https://images.example.com/avatars/alice-v2.png',
      );

      // Clearing avatar with empty string sets it to null in DB
      dbMock.updateReturningSpy.mockResolvedValueOnce([
        {
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          avatar: null,
          role: 0,
          emailVerified: true,
          googleId: null,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const cleared = await service.updateUser('user-1', { avatar: '   ' });
      expect(dbMock.updateSetSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          avatar: null,
        }),
      );
      expect(cleared.avatar).toBeNull();
    });
  });
});
