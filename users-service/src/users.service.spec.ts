import { HttpException } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new UsersService(prisma as unknown as PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('list should return active users with normalized pagination', async () => {
    const users = [
      {
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        deletedAt: null,
      },
    ];

    prisma.user.count.mockReturnValue('count-query');
    prisma.user.findMany.mockReturnValue('find-many-query');
    prisma.$transaction.mockResolvedValue([1, users]);

    const result = await service.list({ page: 2, limit: 1 });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip: 1,
      take: 1,
    });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'count-query',
      'find-many-query',
    ]);
    expect(result).toEqual({
      data: users,
      pagination: {
        page: 2,
        limit: 1,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('profile should require a user id', async () => {
    await expect(service.profile('')).rejects.toThrow(HttpException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('create should reject incomplete identity payloads', async () => {
    await expect(
      service.create({
        username: 'alice',
        email: 'alice@example.com',
        password: '',
        name: 'Alice',
      }),
    ).rejects.toThrow(HttpException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('create should persist valid user payloads', async () => {
    const payload = {
      username: 'alice',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    };

    prisma.user.create.mockResolvedValue({ id: 'user-1', ...payload });

    const result = await service.create(payload);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        ...payload,
        role: 0,
      },
    });
    expect(result).toEqual({ id: 'user-1', ...payload });
  });
});
