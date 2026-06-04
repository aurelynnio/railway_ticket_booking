import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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

  async list(): Promise<any[]> {
    return this.prisma.user.findMany();
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
}
