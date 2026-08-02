import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClient, type User } from '@prisma/client';

interface ListUsersQuery {
  page?: number;
  limit?: number;
}

interface UpdateUserPayload {
  username?: string;
  email?: string;
  name?: string;
  role?: number;
}

interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  name?: string;
  role?: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  health() {
    return {
      service: 'users-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /*
   * User listing keeps deleted accounts out of both the count and page query
   * so pagination metadata always reflects only active records.
   */
  async list(query: ListUsersQuery = {}) {
    const page = this.normalizePositiveInteger(query.page, 1);
    const limit = this.normalizePositiveInteger(query.limit, 10);
    const skip = (page - 1) * limit;

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: { deletedAt: null },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async profile(userId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', 400);
    }
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async update(userId: string, payload: UpdateUserPayload) {
    if (!userId) {
      throw new HttpException('User ID is required', 400);
    }

    /*
     * Profile updates pass the validated caller payload straight to Prisma,
     * making this service the single write path for mutable user fields.
     */
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.username !== undefined ? { username: payload.username } : {}),
        ...(payload.email !== undefined ? { email: payload.email } : {}),
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {}),
      },
    });
  }

  async delete(userId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', 400);
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: `User with ID ${userId} has been deleted` };
  }

  async create(payload: CreateUserPayload) {
    if (!payload.username || !payload.email || !payload.password) {
      throw new HttpException('Username, email and password are required', 400);
    }

    /*
     * Create accepts only fields backed by the users schema, keeping admin
     * inserts from passing profile-only display fields through to Prisma.
     */
    return this.prisma.user.create({
      data: {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        ...(payload.name ? { name: payload.name } : {}),
        role: payload.role ?? 0,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new HttpException('Email is required', 400);
    }
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!userId) {
      throw new HttpException('User ID is required', 400);
    }
    return this.prisma.user.findUnique({ where: { id: userId } });
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
}
