jest.mock('./utils/hash-password.util', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { comparePassword, hashPassword } from './utils/hash-password.util';
import { AuthService } from './auth.service';
import { TokenService } from './utils/generate-token.util';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    authAccount: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tokenService: {
    generateAccessToken: jest.Mock;
    generateRefreshToken: jest.Mock;
    verifyToken: jest.Mock;
    generatePasswordResetToken: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      authAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    tokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
      generatePasswordResetToken: jest.fn(),
    };

    service = new AuthService(
      prisma as unknown as PrismaClient,
      tokenService as unknown as TokenService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('register should hash the password before persisting the account', async () => {
    (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
    prisma.authAccount.findUnique.mockResolvedValue(null);
    prisma.authAccount.create.mockResolvedValue({
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      role: 0,
      createdAt: new Date('2026-06-12T08:00:00.000Z'),
      updatedAt: new Date('2026-06-12T08:00:00.000Z'),
    });

    const result = await service.register({
      email: 'alice@example.com',
      password: 'secret123',
      username: 'alice',
    });

    expect(hashPassword).toHaveBeenCalledWith('secret123');
    expect(prisma.authAccount.create).toHaveBeenCalledWith({
      data: {
        email: 'alice@example.com',
        password: 'hashed-password',
        username: 'alice',
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
    expect(result.email).toBe('alice@example.com');
  });

  it('register should reject duplicate emails', async () => {
    prisma.authAccount.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        email: 'alice@example.com',
        password: 'secret123',
        username: 'alice',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('login should validate credentials and mint access and refresh tokens', async () => {
    prisma.authAccount.findFirst.mockResolvedValue({
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
    prisma.authAccount.findFirst.mockResolvedValue({
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

    expect(tokenService.verifyToken).toHaveBeenCalledWith('refresh-token');
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('forgotPassword should persist only the token hash and return the raw token', async () => {
    prisma.authAccount.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      deletedAt: null,
    });
    tokenService.generatePasswordResetToken.mockResolvedValue('reset-token');

    const result = await service.forgotPassword({
      email: 'alice@example.com',
    });

    const tokenHash = createHash('sha256').update('reset-token').digest('hex');

    expect(prisma.passwordResetToken.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: expect.objectContaining({
        tokenHash,
        expiresAt: expect.any(Date),
      }),
      create: expect.objectContaining({
        userId: 'user-1',
        tokenHash,
        expiresAt: expect.any(Date),
      }),
    });
    expect(result).toBe('reset-token');
  });

  it('resetPassword should replace the password and delete the reset token record', async () => {
    tokenService.verifyToken.mockResolvedValue({
      userId: 'user-1',
      email: 'alice@example.com',
    });
    prisma.passwordResetToken.findUnique.mockResolvedValue({
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
    prisma.authAccount.update.mockResolvedValue({ id: 'user-1' });
    prisma.passwordResetToken.delete.mockResolvedValue({ userId: 'user-1' });
    prisma.$transaction.mockResolvedValue([]);

    const result = await service.resetPassword({
      token: 'reset-token',
      newPassword: 'new-secret',
    });

    expect(tokenService.verifyToken).toHaveBeenCalledWith('reset-token');
    expect(comparePassword).toHaveBeenCalledWith('new-secret', 'old-hash');
    expect(hashPassword).toHaveBeenCalledWith('new-secret');
    expect(prisma.authAccount.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: 'new-hash' },
    });
    expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
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
    prisma.authAccount.findFirst.mockResolvedValue({
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
});
