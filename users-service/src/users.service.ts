import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface ListUsersQuery {
  page?: number;
  limit?: number;
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

  async update(userId: string, payload: any) {
    if (!userId) {
      throw new HttpException('User ID is required', 400);
    }

    /*
     * Profile updates pass the validated caller payload straight to Prisma,
     * making this service the single write path for mutable user fields.
     */
    return this.prisma.user.update({
      where: { id: userId },
      data: payload,
    });
  }

  async delete(userId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', 400);
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: `User with ID ${userId} has been deleted` };
  }

  async create(payload: any) {
    if (!payload.name || !payload.email) {
      throw new HttpException('Name and email are required', 400);
    }

    /*
     * Create enforces a minimal identity payload before persistence so callers
     * cannot insert incomplete user records through this service.
     */
    return this.prisma.user.create({ data: payload });
  }

  async findByEmail(email: string): Promise<any> {
    if (!email) {
      throw new HttpException('Email is required', 400);
    }
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getUserById(userId: string): Promise<any> {
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
