import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RoleGuard } from './role.guard';
import { AccessRole } from '../constants/roles.constants';

describe('RoleGuard', () => {
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
        .mockReturnValueOnce([AccessRole.CUSTOMER]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': 'CUSTOMER',
      })
    );

    expect(allowed).toBe(true);
  });

  it('rejects customer role for operational endpoint', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AccessRole.STAFF]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector);
    expect(() =>
      guard.canActivate(
        makeContext({
          'x-user-id': 'user_1',
          'x-user-role': 'CUSTOMER',
        })
      )
    ).toThrow(ForbiddenException);
  });

  it('rejects invalid role claim', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce([AccessRole.CUSTOMER]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector);
    expect(() =>
      guard.canActivate(
        makeContext({
          'x-user-id': 'user_1',
          'x-user-role': '',
        })
      )
    ).toThrow(ForbiddenException);
  });

  it('allows admin role for admin endpoint without extra confirmation header', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AccessRole.ADMIN]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': 'ADMIN',
      })
    );
    expect(allowed).toBe(true);
  });

  it('allows assistant manager for ticket clerk endpoint (staff tier)', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce([AccessRole.STAFF]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector);
    const allowed = guard.canActivate(
      makeContext({
        'x-user-id': 'user_1',
        'x-user-role': 'STAFF',
      })
    );
    expect(allowed).toBe(true);
  });

  it('rejects staff role for cinema manager endpoint', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce([AccessRole.CINEMA_MANAGER]),
    } as unknown as Reflector;

    const guard = new RoleGuard(reflector);
    expect(() =>
      guard.canActivate(
        makeContext({
          'x-user-id': 'user_1',
          'x-user-role': 'STAFF',
        })
      )
    ).toThrow(ForbiddenException);
  });
});


