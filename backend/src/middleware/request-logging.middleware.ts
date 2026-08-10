import {Request, Response, NextFunction} from 'express';
import {logHttpRequest} from '../infrastructure/logging/logger';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const responseTimeMs = Number(end - start) / 1_000_000;
    logHttpRequest({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: Math.round(responseTimeMs),
      userId: req.currentUser?.userId ?? null,
      societyId: req.currentUser?.societyId ?? null,
      requestId: req.requestId ?? 'unknown',
    });
  });

  next();
}
