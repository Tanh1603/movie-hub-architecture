import { Controller, Headers, HttpCode, HttpStatus, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Webhook } from 'svix';
import { UserService } from '../user.service';
import { SkipThrottle } from '@nestjs/throttler';

type ClerkWebhookEnvelope = {
  data?: { id?: string; user_id?: string; [key: string]: any };
  type?: string;
};

@Controller({ version: '1', path: 'auth/clerk' })
export class AuthWebhookController {
  private readonly logger = new Logger(AuthWebhookController.name);

  constructor(private readonly userService: UserService) {}

  @Post('webhook')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET is required');
    }
    if (!req.rawBody) {
      throw new Error('Raw body is required for webhook signature verification');
    }
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error('Missing Svix signature headers');
    }

    const payload = req.rawBody.toString('utf8');
    const event = new Webhook(webhookSecret).verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEnvelope;

    await this.userService.processClerkWebhook({
      eventId: svixId,
      eventType: event.type,
      data: event.data ?? {},
      raw: event,
      correlationId,
    });

    this.logger.log(`Processed Clerk webhook eventId=${svixId} type=${event.type ?? 'unknown'}`);

    if (event.type === 'session.created') {
      this.logger.log({
        action: 'user.login',
        metadata: { userId: event.data?.user_id, sessionId: event.data?.id }
      }, 'User logged in');
    } else if (event.type === 'session.ended' || event.type === 'session.removed' || event.type === 'session.revoked') {
      this.logger.log({
        action: 'user.logout',
        metadata: { userId: event.data?.user_id, sessionId: event.data?.id, eventType: event.type }
      }, 'User logged out');
    }

    return { ok: true };
  }
}
