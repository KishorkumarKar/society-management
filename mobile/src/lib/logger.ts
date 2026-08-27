/**
 * A small, dependency-free logger that keeps the last N entries in memory
 * so a real device (no attached Metro terminal, no `adb logcat` access for
 * most users) can still show *what actually happened* when something goes
 * wrong — see features/debug/LogViewerScreen.tsx.
 *
 * Deliberately not a wrapper around a remote crash-reporting SDK (Sentry,
 * Bugsnag, etc.) — none was in scope/requested, and adding one means a new
 * account + DSN + privacy review that isn't this app's call to make. This
 * is the local half of that story; swap `logger.error`'s body to also
 * forward to a remote service later without touching any call site.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  /** Which subsystem logged this — 'api', 'auth', 'nav', 'app', etc. */
  scope: string;
  message: string;
  data?: unknown;
  /** Correlates with the backend's x-request-id / req.requestId when set. */
  requestId?: string;
}

// Mirrors backend/src/infrastructure/logging/logger.ts's SENSITIVE_KEYS
// exactly, so a payload that's safe to log server-side is safe here too,
// and nothing pasted from a log entry into a support ticket leaks a token.
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
  if (Array.isArray(value)) return value.map((v) => redact(v, seen));
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (seen.has(obj)) return '[circular]';
    seen.add(obj);
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(val, seen);
    }
    return out;
  }
  return value;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Not a security token — this is a human-correlatable ID for pairing a
 * client-side log entry with the matching server-side one, nothing more.
 * The backend's requestIdMiddleware happily accepts (and echoes back) a
 * client-supplied `x-request-id` as long as it's ≤100 chars, so this value
 * flows straight into `req.requestId` on the server and shows up in
 * winston's structured logs there too.
 */
export function generateRequestId(): string {
  const rand = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `mob-${rand()}${rand()}-${rand()}-${rand()}-${rand()}-${rand()}${rand()}${rand()}`;
}

const MAX_ENTRIES = 300;

class Logger {
  private entries: LogEntry[] = [];
  private listeners = new Set<(entries: LogEntry[]) => void>();

  private push(level: LogLevel, scope: string, message: string, data?: unknown, requestId?: string) {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level,
      scope,
      message,
      data: data !== undefined ? redact(data) : undefined,
      requestId,
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(this.entries.length - MAX_ENTRIES);
    }
    this.notify();

    if (__DEV__) {
      const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      const tag = `[${scope}]${requestId ? ` (${requestId.slice(0, 12)})` : ''}`;
      consoleFn(tag, message, data !== undefined ? entry.data : '');
    }
  }

  debug(scope: string, message: string, data?: unknown, requestId?: string) {
    this.push('debug', scope, message, data, requestId);
  }
  info(scope: string, message: string, data?: unknown, requestId?: string) {
    this.push('info', scope, message, data, requestId);
  }
  warn(scope: string, message: string, data?: unknown, requestId?: string) {
    this.push('warn', scope, message, data, requestId);
  }
  error(scope: string, message: string, data?: unknown, requestId?: string) {
    this.push('error', scope, message, data, requestId);
  }

  getEntries(): LogEntry[] {
    return this.entries;
  }

  clear() {
    this.entries = [];
    this.notify();
  }

  subscribe(listener: (entries: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener(this.entries);
  }

  /** Plain-text dump for the log viewer's Share action / support tickets. */
  exportAsText(): string {
    return this.entries
      .map((e) => {
        const ts = new Date(e.timestamp).toISOString();
        const dataStr = e.data !== undefined ? ` ${safeStringify(e.data)}` : '';
        const reqStr = e.requestId ? ` [req:${e.requestId}]` : '';
        return `${ts} ${e.level.toUpperCase().padEnd(5)} [${e.scope}]${reqStr} ${e.message}${dataStr}`;
      })
      .join('\n');
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

export const logger = new Logger();
