import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  NotificationProviderAdapter,
  NotificationSendPayload,
} from './notification-provider.adapter';

@Injectable()
export class SmtpNotificationProviderAdapter extends NotificationProviderAdapter {
  private readonly logger = new Logger(SmtpNotificationProviderAdapter.name);
  private readonly maxAttempts = 3;
  private readonly retryBackoffMs = [1000, 2000, 4000];
  private readonly externalCallTimeoutMs = 30000;
  private readonly healthCallTimeoutMs = 2000;
  private readonly fromAddress: string;
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    super();
    this.fromAddress = this.configService.get(
      'EMAIL_FROM',
      'MovieHub <noreply@moviehub.com>'
    );
    this.initializeMailer();
  }

  async sendEmail(payload: NotificationSendPayload): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not initialized. Skipping email send.'
      );
      return false;
    }

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const info = await this.withTimeout(
          this.sendWithTransport(payload),
          this.externalCallTimeoutMs
        );

        this.logger.log(
          `Email sent successfully to ${payload.to}: ${info.messageId}`
        );
        return true;
      } catch (error) {
        if (!this.isRetryableError(error) || attempt === this.maxAttempts) {
          this.logger.error(`Failed to send email to ${payload.to}:`, error);
          return false;
        }

        this.logger.warn(
          `Retrying email send. attempt=${attempt + 1}/${this.maxAttempts} to=${
            payload.to
          }`
        );

        await this.sleep(this.retryBackoffMs[attempt - 1]);
      }
    }

    return false;
  }

  private initializeMailer() {
    const emailEnabled =
      this.configService.get('EMAIL_ENABLED', 'false') === 'true';

    if (!emailEnabled) {
      this.logger.warn(
        'Email notifications are DISABLED. Set EMAIL_ENABLED=true to enable.'
      );
      return;
    }

    const host = this.configService.get('EMAIL_HOST', 'smtp.gmail.com');
    const port = parseInt(this.configService.get('EMAIL_PORT', '587'), 10);
    const secure = this.configService.get('EMAIL_SECURE', 'false') === 'true';
    const user = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASSWORD');

    if (!user || !pass) {
      this.logger.warn(
        'Email credentials not configured. Email notifications will not work.'
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    this.verifyConnectionHealth().catch((error) => {
      this.logger.error('Email transporter verification failed:', error);
    });
  }

  private async verifyConnectionHealth(): Promise<void> {
    if (!this.transporter) {
      return;
    }

    await this.withTimeout(
      new Promise<void>((resolve, reject) => {
        this.transporter?.verify((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
      this.healthCallTimeoutMs
    );

    this.logger.log('Email transporter is ready to send emails');
  }

  private sendWithTransport(payload: NotificationSendPayload) {
    return this.transporter!.sendMail({
      from: this.fromAddress,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: payload.attachments,
    });
  }

  private isRetryableError(error: unknown): boolean {
    const errorAsRecord = error as Record<string, unknown>;
    const code =
      typeof errorAsRecord?.code === 'string' ? errorAsRecord.code : '';

    if (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT'
    ) {
      return true;
    }

    if ((error as { name?: string })?.name === 'TimeoutError') {
      return true;
    }

    const responseCode = errorAsRecord?.responseCode;
    if (typeof responseCode !== 'number') {
      return false;
    }

    if (responseCode >= 400 && responseCode < 500) {
      return false;
    }

    return responseCode >= 500;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          const timeoutError = new Error(
            `Request timed out after ${timeoutMs}ms`
          );
          (timeoutError as Error & { code?: string }).code = 'ETIMEDOUT';
          reject(timeoutError);
        }, timeoutMs);
      }),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
