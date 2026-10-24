import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserTokenService } from 'src/commonServices/userToken.service';
import { AdminWarehouseGuard } from './admin-warehouse.guard';

function context(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminWarehouseGuard', () => {
  it('rejects requests without a bearer token', () => {
    const guard = new AdminWarehouseGuard({} as UserTokenService);
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });

  it('rejects valid tokens without the administrator role', () => {
    const tokens = {
      verifyAccessToken: jest.fn(() => ({
        userRes: { userRoles: [{ roleId: 1, roleName: 'Customer' }] },
      })),
    } as unknown as UserTokenService;
    const guard = new AdminWarehouseGuard(tokens);
    expect(() => guard.canActivate(context('Bearer valid'))).toThrow(
      ForbiddenException,
    );
  });

  it('allows authenticated administrators', () => {
    const tokens = {
      verifyAccessToken: jest.fn(() => ({
        userRes: { userRoles: [{ roleId: 88, roleName: 'Admin' }] },
      })),
    } as unknown as UserTokenService;
    const guard = new AdminWarehouseGuard(tokens);
    expect(guard.canActivate(context('Bearer valid'))).toBe(true);
  });
});
