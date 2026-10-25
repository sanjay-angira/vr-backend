import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserTokenService } from './userToken.service';
import {
  ADMIN_API_KEY,
  CUSTOMER_API_KEY,
} from './admin-api.decorator';

function hasAdministratorRole(claims: unknown): boolean {
  if (typeof claims !== 'object' || claims === null) return false;
  const userRes = (claims as { userRes?: unknown }).userRes;
  if (typeof userRes !== 'object' || userRes === null) return false;
  const roles = (userRes as { userRoles?: unknown }).userRoles;
  if (!Array.isArray(roles)) return false;

  return roles.some((role: unknown) => {
    if (typeof role !== 'object' || role === null) return false;
    const roleName = (role as { roleName?: unknown }).roleName;
    return (
      typeof roleName === 'string' &&
      ['admin', 'super admin'].includes(roleName.toLowerCase())
    );
  });
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userTokenService: UserTokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(
      ADMIN_API_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      body?: { userId?: unknown };
      query?: { userId?: unknown };
      customerId?: number;
    }>();

    const customerPolicy = this.reflector.getAllAndOverride<
      { allowGuest?: boolean } | undefined
    >(CUSTOMER_API_KEY, [context.getHandler(), context.getClass()]);
    if (requiresAdmin !== true && customerPolicy === undefined) return true;

    const authorization = request.headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) {
      if (
        !authorization &&
        requiresAdmin !== true &&
        customerPolicy?.allowGuest
      ) {
        if (request.body?.userId != null || request.query?.userId != null) {
          throw new UnauthorizedException(
            'Customer authentication is required for user-owned data',
          );
        }
        return true;
      }
      throw new UnauthorizedException(
        requiresAdmin === true
          ? 'Admin authentication is required'
          : 'Customer authentication is required',
      );
    }

    let claims: unknown;
    try {
      claims = this.userTokenService.verifyAccessToken(match[1]);
    } catch {
      throw new UnauthorizedException(
        requiresAdmin === true
          ? 'Invalid or expired admin token'
          : 'Invalid or expired customer token',
      );
    }

    if (requiresAdmin === true && !hasAdministratorRole(claims)) {
      throw new ForbiddenException('Administrator access is required');
    }

    if (customerPolicy !== undefined) {
      const userRes =
        typeof claims === 'object' && claims !== null
          ? (claims as { userRes?: unknown }).userRes
          : undefined;
      const customerId =
        typeof userRes === 'object' && userRes !== null
          ? Number((userRes as { id?: unknown }).id)
          : NaN;
      if (!Number.isSafeInteger(customerId) || customerId <= 0) {
        throw new ForbiddenException('Customer access is required');
      }
      if (hasAdministratorRole(claims)) {
        throw new ForbiddenException('Customer access is required');
      }

      for (const providedId of [
        request.body?.userId,
        request.query?.userId,
      ]) {
        if (providedId == null || providedId === '') continue;
        if (Number(providedId) !== customerId) {
          throw new ForbiddenException(
            'You cannot access another customer’s data',
          );
        }
      }
      request.customerId = customerId;
    }
    return true;
  }
}
