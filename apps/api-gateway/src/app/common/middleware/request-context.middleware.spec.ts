import { RequestContextMiddleware } from './request-context.middleware';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '@movie-hub/shared-types/common';

describe('RequestContextMiddleware', () => {
  it('creates request context and propagates headers', () => {
    const middleware = new RequestContextMiddleware();
    const req: any = {
      headers: {
        [CORRELATION_ID_HEADER]: 'corr-1',
        [REQUEST_ID_HEADER]: 'req-1',
      },
      user: { id: 'user-1' },
    };
    const res: any = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.requestContext.correlationId).toBe('corr-1');
    expect(req.requestContext.requestId).toBe('req-1');
    expect(req.requestContext.userId).toBe('user-1');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'corr-1');
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'req-1');
    expect(next).toHaveBeenCalled();
  });
});
