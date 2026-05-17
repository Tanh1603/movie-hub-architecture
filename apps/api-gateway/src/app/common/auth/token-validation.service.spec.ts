import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { TokenValidationService } from './token-validation.service';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

describe('TokenValidationService', () => {
  let service: TokenValidationService;
  let configService: jest.Mocked<ConfigService>;
  let redis: any;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CLERK_SECRET_KEY') return 'sk_test';
        if (key === 'CLERK_ISSUER') return 'https://example.clerk.accounts.dev';
        if (key === 'CLERK_AUDIENCE') return 'moviehub-web';
        if (key === 'CLERK_AUTHORIZED_PARTIES') return 'https://moviehub.vn';
        if (key === 'CLERK_JWT_KEY') return 'jwt_key';
        return undefined;
      }),
    } as any;

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    service = new TokenValidationService(configService, redis);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('validates a correct token payload', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce({
      sub: 'user_1',
      iss: 'https://example.clerk.accounts.dev',
      exp: 9999999999,
    });

    const payload = await service.validateTokenOrThrow('header.payload.signature');
    expect(payload.sub).toBe('user_1');
  });

  it('rejects malformed token payload when account key is extracted', () => {
    const account = service.extractAccountKey('bad-token');
    expect(account.startsWith('token:')).toBe(true);
  });

  it('warns when token verification latency exceeds 50ms', async () => {
    const loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const nowSpy = jest.spyOn(Date, 'now');

    nowSpy
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1061);
    (verifyToken as jest.Mock).mockResolvedValueOnce({
      sub: 'user_1',
      iss: 'https://example.clerk.accounts.dev',
      exp: 9999999999,
    });

    await service.validateTokenOrThrow('header.payload.signature');
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('latency 61ms exceeded target')
    );
  });

  it('rejects issuer mismatch', async () => {
    (verifyToken as jest.Mock).mockResolvedValueOnce({
      sub: 'user_1',
      iss: 'https://wrong.clerk.accounts.dev',
      exp: 9999999999,
    });

    await expect(
      service.validateTokenOrThrow('header.payload.signature')
    ).rejects.toThrow('Token issuer mismatch');
  });
});

