import * as winston from 'winston';
import * as path from 'path';
import {config} from '../../config/env.config';

/**
 * Fields that must never reach a log file or console, regardless of which
 * object shape they appear in (request body, headers, user object, etc).
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'refresh_token',
  'authorization',
  'jwt',
  'secret',
]);

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((v) => redact(v, seen));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (seen.has(obj)) return '[circular]';
    seen.add(obj);

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redact(val, seen);
      }
    }
    return out;
  }

  return value;
}

const redactFormat = winston.format((info) => {
  const redacted = redact(info) as winston.Logform.TransformableInfo;
  return redacted;
});

export const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    redactFormat(),
    winston.format.timestamp(),
    winston.format.errors({stack: true}),
    winston.format.json(),
  ),
  defaultMeta: {service: 'society-management-api'},
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        redactFormat(),
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({timestamp, level, message, requestId, ...meta}) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ''}: ${message} ${metaStr}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: path.join(config.log.dir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(config.log.dir, 'combined.log'),
    }),
  ],
  exitOnError: false,
});

/**
 * Structured HTTP access log line — called from request-logging middleware.
 * Deliberately takes a narrow, explicit set of fields rather than the raw
 * request/response objects, so nothing sensitive can leak in by accident.
 */
export function logHttpRequest(fields: {
  method: string;
  url: string;
  statusCode: number;
  responseTimeMs: number;
  userId?: number | null;
  societyId?: number | null;
  requestId: string;
  error?: string;
}): void {
  const level = fields.statusCode >= 500 ? 'error' : fields.statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${fields.method} ${fields.url} ${fields.statusCode} ${fields.responseTimeMs}ms`, fields);
}
