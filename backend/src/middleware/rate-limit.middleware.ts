import rateLimit from 'express-rate-limit';
import {config} from '../config/env.config';
import {ApiError} from '../utils/api-response';

export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooManyRequests()),
});

/** Tighter limit specifically on the login endpoint to blunt credential stuffing / brute force. */
export const loginRateLimiter = rateLimit({
  windowMs: config.loginRateLimit.windowMs,
  max: config.loginRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooManyRequests('Too many login attempts, please try again later')),
});
