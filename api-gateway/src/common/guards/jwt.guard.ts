import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Reflector } from '@nestjs/core';
import { firstValueFrom } from 'rxjs';
import { ACCESS_TOKEN_COOKIE_NAME } from '../../auth/auth.constants';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import type { Request } from 'express';
import type { RequestUser } from '../interfaces/request-user.interface';

type AuthenticatedRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, string | undefined>;
  user?: RequestUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('auth_service')
    private readonly authClient: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
    const authHeader = request.headers['authorization'];
    const bearerToken =
      typeof authHeader === 'string'
        ? this.extractBearerToken(authHeader)
        : undefined;
    const token = cookieToken ?? bearerToken;

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const user = await firstValueFrom<RequestUser>(
        this.authClient.send<RequestUser>({ cmd: 'auth.validate_token' }, { token }),
      );
      request.user = user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractBearerToken(header: string) {
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
