import { NextFunction, Request, Response } from 'express';

type WindowState = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60 * 1000;
const LIMIT = 60;
const state = new Map<string, WindowState>();

const sensitivePathPatterns: RegExp[] = [
  /\/api\/v\d+\/bookings($|\/)/,
  /\/api\/v\d+\/payments($|\/)/,
  /\/api\/v\d+\/promotions\/validate\//,
  /\/api\/v\d+\/(cinemas|halls|showtimes|genres|movie-releases|staff)($|\/)/,
];

function isSensitiveRoute(path: string): boolean {
  return sensitivePathPatterns.some((pattern) => pattern.test(path));
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

export function sensitiveRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!isSensitiveRoute(req.path)) {
    return next();
  }

  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${ip}:${req.path}`;
  const current = state.get(key);

  if (!current || now >= current.resetAt) {
    state.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= LIMIT) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      errors: [
        {
          code: 'RATE_LIMITED',
          field: null,
          message: 'Rate limit exceeded for this endpoint',
        },
      ],
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  current.count += 1;
  state.set(key, current);
  next();
}
