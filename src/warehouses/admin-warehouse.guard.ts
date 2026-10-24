import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserTokenService } from 'src/commonServices/userToken.service';

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
export class AdminWarehouseGuard implements CanActivate {
  constructor(private readonly userTokenService: UserTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    const authorization = request.headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) {
      throw new UnauthorizedException('Admin authentication is required');
    }

    let claims: unknown;
    try {
      claims = this.userTokenService.verifyAccessToken(match[1]);
    } catch {
      throw new UnauthorizedException('Invalid or expired admin token');
    }

    if (!hasAdministratorRole(claims)) {
      throw new ForbiddenException('Administrator access is required');
    }
    return true;
  }
}
