import { SetMetadata } from '@nestjs/common';

/** Role values stored in the users collection */
export enum UserRole {
  USER = 0,
  ADMIN = 1,
}

export const ROLES_KEY = 'roles';

/**
 * Decorator để yêu cầu role cụ thể cho endpoint.
 * Phải dùng cùng với JwtAuthGuard (global) — RolesGuard đọc `request.user.role`.
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Post()
 * create() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
