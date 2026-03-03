import type { Request, Response, NextFunction } from 'express';

interface RateWindow {
  count: number;
  resetAt: number;
}

// In-memory rate limiter per sessionId.
// This runs per-process, so in a multi-instance setup you'd need Redis.
// For this project's scope, in-memory is fine.
const windows = new Map<string, RateWindow>();

const LIMIT = parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);

export function rateLimitBySession(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.body?.sessionId as string | undefined;

  if (!sessionId) {
    next();
    return;
  }

  const now = Date.now();
  const existing = windows.get(sessionId);

  if (!existing || now > existing.resetAt) {
    windows.set(sessionId, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (existing.count >= LIMIT) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfterSeconds: retryAfter,
    });
    return;
  }

  existing.count++;
  next();
}
