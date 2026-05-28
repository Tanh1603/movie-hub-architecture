import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RoleGuard } from './role.guard';
import { AppRole } from '@movie-hub/shared-types';

describe('RoleGuard', () => {
  const rbacDeniedCounter = {
    inc: jest.fn(),
  } as any;

  function makeContext(headers: Record<string, any>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
      getHandler: () => ({ name: 'handler' }),
      getClass: () => ({ name: 'Controller' }),
    } as any;
  }

  it('allows customer role for customer endpoint', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce([AppRole.CUSTOMER]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': AppRole.CUSTOMER,
      })
    );

    expect(allowed).toBe(true);
  });

  it('rejects customer role for operational endpoint', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AppRole.STAFF]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    expect(() =>
      guard.canActivate(
        makeContext({
          'x-user-id': 'user_1',
          'x-user-role': AppRole.CUSTOMER,
        })
      )
    ).toThrow(ForbiddenException);
  });

  it('rejects invalid role claim', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce([AppRole.CUSTOMER]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    expect(() =>
      guard.canActivate(
        makeContext({
          'x-user-id': 'user_1',
          'x-user-role': '',
        })
      )
    ).toThrow(ForbiddenException);
  });

  it('allows admin role for admin endpoint', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AppRole.ADMIN]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': AppRole.ADMIN,
      })
    );
    expect(allowed).toBe(true);
  });

  it('allows staff role for staff endpoint', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AppRole.STAFF]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': AppRole.STAFF,
      })
    );
    expect(allowed).toBe(true);
  });

  it('rejects staff role for cinema manager endpoint', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce([AppRole.CINEMA_MANAGER]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    expect(() =>
      guard.canActivate(
        makeContext({
          'x-user-id': 'user_1',
          'x-user-role': AppRole.STAFF,
        })
      )
    ).toThrow(ForbiddenException);
  });

  it('allows cinema manager for staff endpoint', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AppRole.STAFF]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector, rbacDeniedCounter);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': AppRole.CINEMA_MANAGER,
      })
    );
    expect(allowed).toBe(true);
  });
});
