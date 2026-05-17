import { AuthWebhookController } from './auth-webhook.controller';

describe('AuthWebhookController', () => {
  const userService = {
    processClerkWebhook: jest.fn(),
  } as any;

  let controller: AuthWebhookController;

  beforeEach(() => {
    controller = new AuthWebhookController(userService);
    jest.clearAllMocks();
  });

  it('verifies signature and forwards user.created event', async () => {
    const secretRaw = Buffer.from('test_secret_key').toString('base64');
    process.env.CLERK_WEBHOOK_SECRET = `whsec_${secretRaw}`;

    const payload = JSON.stringify({ type: 'user.created', data: { id: 'user_1' } });
    const id = 'msg_1';
    const ts = `${Math.floor(Date.now() / 1000)}`;
    const content = `${id}.${ts}.${payload}`;
    const { createHmac } = await import('crypto');
    const signature = createHmac('sha256', Buffer.from(secretRaw, 'base64'))
      .update(content)
      .digest('base64');

    await controller.handleClerkWebhook(
      { rawBody: Buffer.from(payload) } as any,
      id,
      ts,
      `v1,${signature}`,
      'cid-1'
    );

    expect(userService.processClerkWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: id, eventType: 'user.created' })
    );
  });
});
