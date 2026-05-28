/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';
import { SmtpService } from './smtp.service';

const sendMailMock = jest.fn();
const verifyMock = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
    verify: verifyMock,
  })),
}));

describe('SmtpService', () => {
  function buildService() {
    const configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          EMAIL_ENABLED: 'true',
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: '587',
          EMAIL_SECURE: 'false',
          EMAIL_USER: 'user',
          EMAIL_PASSWORD: 'pass',
          EMAIL_FROM: 'MovieHub <noreply@moviehub.com>',
        };
        return values[key] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    verifyMock.mockImplementation((callback: (error: unknown) => void) =>
      callback(null)
    );

    const service = new SmtpService(configService);
    return { service };
  }

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('retries retryable errors and succeeds on a later attempt', async () => {
    const { service } = buildService();
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock
      .mockRejectedValueOnce({ responseCode: 503 })
      .mockResolvedValueOnce({ messageId: 'msg-1' });

    await expect(
      service.sendEmail({
        to: 'a@b.com',
        subject: 'test',
        html: '<p>hello</p>',
      })
    ).resolves.toBe(true);

    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it('fails fast on 4xx without retry', async () => {
    const { service } = buildService();
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock.mockRejectedValue({ responseCode: 400 });

    await expect(
      service.sendEmail({
        to: 'a@b.com',
        subject: 'test',
        html: '<p>hello</p>',
      })
    ).resolves.toBe(false);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it('caps retries at max 3 attempts', async () => {
    const { service } = buildService();
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock.mockRejectedValue({ responseCode: 503 });

    await expect(
      service.sendEmail({
        to: 'a@b.com',
        subject: 'test',
        html: '<p>hello</p>',
      })
    ).resolves.toBe(false);

    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });

  it('enforces timeout behavior for external calls', async () => {
    const { service } = buildService();
    (service as any).externalCallTimeoutMs = 5;
    (service as any).retryBackoffMs = [0, 0, 0];
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock.mockImplementation(() => new Promise(() => {}));

    jest.useFakeTimers();
    const promise = service.sendEmail({
      to: 'a@b.com',
      subject: 'test',
      html: '<p>hello</p>',
    });

    await jest.advanceTimersByTimeAsync(50);

    await expect(promise).resolves.toBe(false);
    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });
});