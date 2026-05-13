import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { TokenValidationService } from '../auth/token-validation.service';
import { BruteForceProtectionService } from '../auth/brute-force-protection.service';
import { UserMessage } from '@movie-hub/shared-types';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

type RedisValue = {
  value: string;
  expiresAt?: number;
};

class InMemoryRedis {
  private store = new Map<string, RedisValue>();

  private isExpired(entry?: RedisValue): boolean {
    if (!entry?.expiresAt) {
      return false;
    }
    return Date.now() >= entry.expiresAt;
  }

  private read(key: string): RedisValue | undefined {
    const entry = this.store.get(key);
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async exists(key: string): Promise<boolean> {
    return Boolean(this.read(key));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt =
      ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        count += 1;
      }
    }
    return count;
  }

  pipeline() {
    const redis = this;
    const commands: Array<() => Promise<any>> = [];

    return {
      incr(key: string) {
        commands.push(async () => {
          const entry = redis.read(key);
          const current = entry ? Number(entry.value) : 0;
          const next = current + 1;
          redis.store.set(key, {
            value: String(next),
            expiresAt: entry?.expiresAt,
          });
          return next;
        });
        return this;
      },
      expire(key: string, ttlSeconds: number) {
        commands.push(async () => {
          const entry = redis.read(key);
          if (!entry) {
            return 0;
          }
          redis.store.set(key, {
            value: entry.value,
            expiresAt: Date.now() + ttlSeconds * 1000,
          });
          return 1;
        });
        return this;
      },
      async exec() {
        const results: Array<[null, any]> = [];
        for (const command of commands) {
          results.push([null, await command()]);
        }
        return results;
      },
    };
  }
}

describe('ClerkAuthGuard integration scenarios', () => {
  let guard: ClerkAuthGuard;
  let reflector: Reflector;
  let tokenValidationService: jest.Mocked<TokenValidationService>;
  let bruteForceProtectionService: BruteForceProtectionService;
  let userClient: { send: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-09T10:00:00.000Z'));

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    tokenValidationService = {
      validateTokenOrThrow: jest.fn(),
      extractAccountKey: jest.fn().mockReturnValue('user_123'),
    } as unknown as jest.Mocked<TokenValidationService>;

    bruteForceProtectionService = new BruteForceProtectionService(
      new InMemoryRedis() as any
    );

    userClient = {
      send: jest.fn((pattern: string) => {
        if (pattern === UserMessage.GET_USER_DETAIL) {
          return of({ email: 'customer@example.com' });
        }
        if (pattern === UserMessage.GET_USER_ROLES) {
          return of(['CUSTOMER']);
        }
        if (pattern === UserMessage.STAFF.FIND_BY_EMAIL) {
          return throwError(() => new Error('not staff'));
        }
        return of([]);
      }),
    };

    guard = new ClerkAuthGuard(
      reflector,
      userClient as any,
      tokenValidationService,
      bruteForceProtectionService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function executionContextForRequest(request: any): any {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    };
  }

  it('rejects missing token', async () => {
    const request = {
      headers: {},
      cookies: {},
      ip: '10.0.0.1',
    };

    await expect(
      guard.canActivate(executionContextForRequest(request))
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenValidationService.validateTokenOrThrow).not.toHaveBeenCalled();
  });

  it('rejects invalid token', async () => {
    tokenValidationService.validateTokenOrThrow.mockRejectedValueOnce(
      new Error('invalid token signature')
    );

    const request = {
      headers: { authorization: 'Bearer invalid-token' },
      cookies: {},
      ip: '10.0.0.2',
    };

    await expect(
      guard.canActivate(executionContextForRequest(request))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired token', async () => {
    tokenValidationService.validateTokenOrThrow.mockRejectedValueOnce(
      new Error('JWT is expired')
    );

    const request = {
      headers: { authorization: 'Bearer expired-token' },
      cookies: {},
      ip: '10.0.0.3',
    };

    await expect(
      guard.canActivate(executionContextForRequest(request))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('locks out on 6th failed attempt', async () => {
    tokenValidationService.validateTokenOrThrow.mockRejectedValue(
      new Error('invalid token')
    );

    const baseRequest = {
      headers: { authorization: 'Bearer bad-token' },
      cookies: {},
      ip: '10.0.0.4',
    };

    for (let i = 1; i <= 5; i++) {
      const request = { ...baseRequest, headers: { ...baseRequest.headers } };
      await expect(
        guard.canActivate(executionContextForRequest(request))
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    const sixthRequest = {
      ...baseRequest,
      headers: { ...baseRequest.headers },
    };
    await expect(
      guard.canActivate(executionContextForRequest(sixthRequest))
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenValidationService.validateTokenOrThrow).toHaveBeenCalledTimes(5);
  });

  it('unlocks after 5 minutes and accepts valid token', async () => {
    tokenValidationService.validateTokenOrThrow.mockRejectedValue(
      new Error('invalid token')
    );

    const baseRequest = {
      headers: { authorization: 'Bearer bad-token' },
      cookies: {},
      ip: '10.0.0.5',
    };

    for (let i = 1; i <= 5; i++) {
      const request = { ...baseRequest, headers: { ...baseRequest.headers } };
      await expect(
        guard.canActivate(executionContextForRequest(request))
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    tokenValidationService.validateTokenOrThrow.mockReset();
    tokenValidationService.validateTokenOrThrow.mockResolvedValue({
      sub: 'user_123',
      iss: 'https://example.clerk.accounts.dev',
    } as any);

    jest.setSystemTime(new Date('2026-05-09T10:05:01.000Z'));

    const requestAfterUnlock = {
      headers: { authorization: 'Bearer valid-token' },
      cookies: {},
      ip: '10.0.0.5',
    };

    const allowed = await guard.canActivate(
      executionContextForRequest(requestAfterUnlock)
    );

    expect(allowed).toBe(true);
    expect(requestAfterUnlock.headers['x-user-id']).toBe('user_123');
    expect(requestAfterUnlock.headers['x-user-role']).toBe('CUSTOMER');
  });

  it('prefers RBAC role over staff position when both are present', async () => {
    tokenValidationService.validateTokenOrThrow.mockResolvedValueOnce({
      sub: 'user_123',
      iss: 'https://example.clerk.accounts.dev',
    } as any);

    userClient.send.mockImplementation((pattern: string) => {
      if (pattern === UserMessage.GET_USER_ROLES) {
        return of(['SUPER_ADMIN']);
      }
      if (pattern === UserMessage.GET_USER_DETAIL) {
        return of({ email: 'admin@example.com' });
      }
      if (pattern === UserMessage.STAFF.FIND_BY_EMAIL) {
        return of({
          data: {
            id: 'staff_1',
            cinemaId: 'cinema_1',
            position: 'TICKET_CLERK',
          },
        });
      }
      return of([]);
    });

    const request: any = {
      headers: { authorization: 'Bearer valid-token' },
      cookies: {},
      ip: '10.0.0.6',
    };

    const allowed = await guard.canActivate(executionContextForRequest(request));
    expect(allowed).toBe(true);
    expect(request.headers['x-user-role']).toBe('ADMIN');
    expect(request.headers['x-cinema-id']).toBe('cinema_1');
    expect(request.staffContext).toEqual({
      staffId: 'staff_1',
      cinemaId: 'cinema_1',
      role: 'TICKET_CLERK',
    });
  });

  it('enforces permission metadata from reflector and allows matching permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce({
      resource: 'config',
      action: 'read',
      scope: 'global',
    });
    tokenValidationService.validateTokenOrThrow.mockResolvedValueOnce({
      sub: 'user_123',
      iss: 'https://example.clerk.accounts.dev',
    } as any);

    userClient.send.mockImplementation((pattern: string) => {
      if (pattern === UserMessage.GET_USER_ROLES) {
        return of(['SUPER_ADMIN']);
      }
      if (pattern === UserMessage.GET_USER_DETAIL) {
        return of({ email: 'admin@example.com' });
      }
      if (pattern === UserMessage.STAFF.FIND_BY_EMAIL) {
        return throwError(() => new Error('not staff'));
      }
      if (pattern === UserMessage.GET_PERMISSIONS) {
        return of(['config:read:global']);
      }
      return of([]);
    });

    const request: any = {
      headers: { authorization: 'Bearer valid-token' },
      cookies: {},
      ip: '10.0.0.7',
    };

    const allowed = await guard.canActivate(executionContextForRequest(request));
    expect(allowed).toBe(true);
  });

  it('rejects when required permission is missing', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce({
      resource: 'config',
      action: 'update',
      scope: 'global',
    });
    tokenValidationService.validateTokenOrThrow.mockResolvedValueOnce({
      sub: 'user_123',
      iss: 'https://example.clerk.accounts.dev',
    } as any);

    userClient.send.mockImplementation((pattern: string) => {
      if (pattern === UserMessage.GET_USER_ROLES) {
        return of(['CUSTOMER']);
      }
      if (pattern === UserMessage.GET_USER_DETAIL) {
        return of({ email: 'customer@example.com' });
      }
      if (pattern === UserMessage.STAFF.FIND_BY_EMAIL) {
        return throwError(() => new Error('not staff'));
      }
      if (pattern === UserMessage.GET_PERMISSIONS) {
        return of(['config:read:global']);
      }
      return of([]);
    });

    const request: any = {
      headers: { authorization: 'Bearer valid-token' },
      cookies: {},
      ip: '10.0.0.8',
    };

    await expect(
      guard.canActivate(executionContextForRequest(request))
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns forbidden when validated token has invalid user context', async () => {
    tokenValidationService.validateTokenOrThrow.mockResolvedValueOnce({
      sub: 'invalid-subject',
      iss: 'https://example.clerk.accounts.dev',
    } as any);

    userClient.send.mockImplementation((pattern: string) => {
      if (pattern === UserMessage.GET_USER_ROLES) {
        return of(['CUSTOMER']);
      }
      if (pattern === UserMessage.GET_USER_DETAIL) {
        return of({ email: 'customer@example.com' });
      }
      if (pattern === UserMessage.STAFF.FIND_BY_EMAIL) {
        return throwError(() => new Error('not staff'));
      }
      return of([]);
    });

    const request: any = {
      headers: { authorization: 'Bearer valid-token' },
      cookies: {},
      ip: '10.0.0.9',
    };

    await expect(
      guard.canActivate(executionContextForRequest(request))
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
