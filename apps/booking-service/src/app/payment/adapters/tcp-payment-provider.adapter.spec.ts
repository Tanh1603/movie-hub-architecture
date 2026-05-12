import { Observable, of, throwError } from 'rxjs';
import { TcpPaymentProviderAdapter } from './tcp-payment-provider.adapter';

describe('TcpPaymentProviderAdapter', () => {
  const userDetail = { id: 'user-1', email: 'user@example.com' } as any;

  function buildAdapter() {
    const userClient = {
      send: jest.fn(),
    };

    const adapter = new TcpPaymentProviderAdapter(userClient as any);
    return { adapter, userClient };
  }

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('retries retryable errors and succeeds on a later attempt', async () => {
    const { adapter, userClient } = buildAdapter();
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    userClient.send
      .mockReturnValueOnce(throwError(() => ({ response: { status: 503 } })))
      .mockReturnValueOnce(of(userDetail));

    await expect(adapter.getUserDetail('user-1')).resolves.toEqual(userDetail);
    expect(userClient.send).toHaveBeenCalledTimes(2);
  });

  it('fails fast on 4xx without retry', async () => {
    const { adapter, userClient } = buildAdapter();
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    userClient.send.mockReturnValue(
      throwError(() => ({ response: { status: 400 } }))
    );

    await expect(adapter.getUserDetail('user-1')).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(userClient.send).toHaveBeenCalledTimes(1);
  });

  it('caps retries at max 3 attempts', async () => {
    const { adapter, userClient } = buildAdapter();
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    userClient.send.mockReturnValue(
      throwError(() => ({ response: { status: 503 } }))
    );

    await expect(adapter.getUserDetail('user-1')).rejects.toMatchObject({
      response: { status: 503 },
    });
    expect(userClient.send).toHaveBeenCalledTimes(3);
  });

  it('enforces timeout behavior for internal calls', async () => {
    const { adapter, userClient } = buildAdapter();
    (adapter as any).internalCallTimeoutMs = 1;
    (adapter as any).retryBackoffMs = [0, 0, 0];
    jest.spyOn(adapter as any, 'sleep').mockResolvedValue(undefined);

    userClient.send.mockReturnValue(new Observable(() => {}));

    await expect(adapter.getUserDetail('user-1')).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    expect(userClient.send).toHaveBeenCalledTimes(3);
  });
});
