import { ApiRequestError } from '../api/types';

/**
 * Every screen's `query.isError` branch was showing a generic hardcoded
 * string ("Could not load this bill.") instead of the backend's actual
 * error message and requestId — which defeats the point of correlating
 * client logs with server logs. This is the one-line fix used everywhere:
 * `describeQueryError(query.error, 'Could not load this bill.')`.
 */
export function describeQueryError(
  error: unknown,
  fallbackMessage: string,
): { message: string; requestId?: string } {
  if (error instanceof ApiRequestError) {
    return { message: error.message || fallbackMessage, requestId: error.requestId };
  }
  return { message: fallbackMessage };
}
