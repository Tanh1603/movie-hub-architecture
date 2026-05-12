/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';
import { SmtpNotificationProviderAdapter } from './smtp-notification-provider.adapter';

const sendMailMock = jest.fn();
const verifyMock = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: sendMailMock,
    verify: verifyMock,
  })),
}));

describe('SmtpNotificationProviderAdapter', () => {
  function buildAdapter() {
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

    const adapter = new SmtpNotificationProviderAdapter(configService);
    return { adapter };
  }

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('retries retryable errors and succeeds on a later attempt', async () => {
    const { adapter } = buildAdapter();
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock
      .mockRejectedValueOnce({ responseCode: 503 })
      .mockResolvedValueOnce({ messageId: 'msg-1' });

    await expect(
      adapter.sendEmail({
        to: 'a@b.com',
        subject: 'test',
        html: '<p>hello</p>',
      })
    ).resolves.toBe(true);

    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it('fails fast on 4xx without retry', async () => {
    const { adapter } = buildAdapter();
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock.mockRejectedValue({ responseCode: 400 });

    await expect(
      adapter.sendEmail({
        to: 'a@b.com',
        subject: 'test',
        html: '<p>hello</p>',
      })
    ).resolves.toBe(false);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });

  it('caps retries at max 3 attempts', async () => {
    const { adapter } = buildAdapter();
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock.mockRejectedValue({ responseCode: 503 });

    await expect(
      adapter.sendEmail({
        to: 'a@b.com',
        subject: 'test',
        html: '<p>hello</p>',
      })
    ).resolves.toBe(false);

    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });

  it('enforces timeout behavior for external calls', async () => {
    const { adapter } = buildAdapter();
    (adapter as any).externalCallTimeoutMs = 5;
    (adapter as any).retryBackoffMs = [0, 0, 0];
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    sendMailMock.mockImplementation(() => new Promise(() => {}));

    jest.useFakeTimers();
    const promise = adapter.sendEmail({
      to: 'a@b.com',
      subject: 'test',
      html: '<p>hello</p>',
    });

    await jest.advanceTimersByTimeAsync(50);

    await expect(promise).resolves.toBe(false);
    expect(sendMailMock).toHaveBeenCalledTimes(3);
  });
});
