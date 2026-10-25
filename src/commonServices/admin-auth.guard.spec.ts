import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserTokenService } from './userToken.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { ADMIN_API_KEY } from './admin-api.decorator';

describe('AdminAuthGuard', () => {
  const getAllAndOverride = jest.fn<
    boolean | { allowGuest?: boolean } | undefined,
    [string, unknown[]]
  >();
  const verifyAccessToken = jest.fn();
  const guard = new AdminAuthGuard(
    { getAllAndOverride } as unknown as Reflector,
    { verifyAccessToken } as unknown as UserTokenService,
  );

  function context(
    adminPolicy: boolean | undefined,
    authorization?: string,
    customerPolicy?: { allowGuest?: boolean },
    body?: { userId?: unknown },
    query?: { userId?: unknown },
  ): ExecutionContext {
    getAllAndOverride.mockImplementation((key) =>
      key === ADMIN_API_KEY ? adminPolicy : customerPolicy,
    );
    const request: {
      headers: { authorization?: string };
      body?: { userId?: unknown };
      query?: { userId?: unknown };
      customerId?: number;
    } = { headers: { authorization }, body, query };
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes that are not marked as admin-only', () => {
    expect(guard.canActivate(context(undefined))).toBe(true);
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects admin routes without a bearer token', () => {
    expect(() => guard.canActivate(context(true))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects invalid or expired tokens', () => {
    verifyAccessToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() =>
      guard.canActivate(context(true, 'Bearer invalid-token')),
    ).toThrow(UnauthorizedException);
  });

  it('rejects valid tokens without an administrator role', () => {
    verifyAccessToken.mockReturnValue({
      userRes: { userRoles: [{ roleName: 'customer' }] },
    });

    expect(() =>
      guard.canActivate(context(true, 'Bearer customer-token')),
    ).toThrow(ForbiddenException);
  });

  it.each(['admin', 'Super Admin'])(
    'allows the %s role on admin routes',
    (roleName) => {
      verifyAccessToken.mockReturnValue({
        userRes: { userRoles: [{ roleName }] },
      });

      expect(
        guard.canActivate(context(true, 'Bearer administrator-token')),
      ).toBe(true);
    },
  );

  it('requires a token for private customer endpoints', () => {
    expect(() => guard.canActivate(context(undefined, undefined, {}))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows a customer token and rejects IDs belonging to another user', () => {
    verifyAccessToken.mockReturnValue({
      userRes: { id: 12, userRoles: [] },
    });

    expect(
      guard.canActivate(context(undefined, 'Bearer customer-token', {}, {
        userId: 12,
      })),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        context(undefined, 'Bearer customer-token', {}, undefined, {
          userId: 13,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows guest requests only when they do not claim a user ID', () => {
    const guestPolicy = { allowGuest: true };
    expect(
      guard.canActivate(context(undefined, undefined, guestPolicy)),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        context(undefined, undefined, guestPolicy, { userId: 12 }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects an administrator token from customer-only endpoints', () => {
    verifyAccessToken.mockReturnValue({
      userRes: {
        id: 12,
        userRoles: [{ roleName: 'admin' }],
      },
    });

    expect(() =>
      guard.canActivate(context(undefined, 'Bearer admin-token', {})),
    ).toThrow(ForbiddenException);
  });
});
