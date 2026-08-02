import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorator/roles.decorator';
import type { Request } from 'express';
import type { RequestUser } from '../interfaces/request-user.interface';

interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không có @Roles() → cho phép tất cả user đã đăng nhập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.role === undefined) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.map((r) => UserRole[r]).join(', ')}`,
      );
    }

    return true;
  }
}
