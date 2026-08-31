import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { secureStorage } from '../lib/secureStorage';
import { logger, generateRequestId } from '../lib/logger';
import { ApiErrorBody, ApiRequestError } from './types';

// API_PREFIX on the backend defaults to /api/v1 (backend/src/config/env.config.ts).
// Set the real host in app.json -> expo.extra.apiBaseUrl (or via EXPO_PUBLIC_API_BASE_URL).
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

  console.log("+++++++++",API_BASE_URL,process.env.EXPO_PUBLIC_API_BASE_URL)

logger.info('api', `Client configured`, { baseURL: API_BASE_URL });

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Session-expired hook -----------------------------------------------
// The client can't import the auth store directly (store -> hooks -> client
// would cycle), so the store registers a callback here on startup and the
// interceptor calls it once refresh is no longer possible. This is the
// ONLY path that should force a logout from a 401.
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler;
}

// Augmented per-request so the response/error interceptor can log a
// duration and pair it back up with the request-start log line.
interface RequestMeta {
  requestId: string;
  startedAt: number;
}
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _meta?: RequestMeta;
    _retried?: boolean;
  }
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Client-generated, but the backend's requestIdMiddleware accepts and
  // echoes back an incoming x-request-id (≤100 chars) rather than
  // minting its own — so this exact ID shows up in the server's winston
  // logs too. Pairing a mobile log entry with the matching backend entry
  // is then just "search both logs for this string".
  const requestId = generateRequestId();
  config.headers['x-request-id'] = requestId;
  config._meta = { requestId, startedAt: Date.now() };

  logger.debug('api', `→ ${(config.method ?? 'get').toUpperCase()} ${config.url}`, { params: config.params }, requestId);

  return config;
});

// --- 401 handling: refresh once, replay the request, or force logout ----
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(requestId: string): Promise<string | null> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) {
    logger.warn('api', 'Refresh skipped: no refresh token stored', undefined, requestId);
    return null;
  }

  try {
    // Deliberately a bare axios call, not apiClient, to avoid recursing
    // through this same interceptor.
    const res = await axios.post<{ success: true; data: { accessToken: string; refreshToken: string } }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'x-request-id': requestId } },
    );
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
    await secureStorage.setTokens(accessToken, newRefreshToken);
    logger.info('api', 'Access token refreshed', undefined, requestId);
    return accessToken;
  } catch (err) {
    logger.error('api', 'Refresh token request failed — signing out', { error: describeAxiosError(err) }, requestId);
    await secureStorage.clear();
    return null;
  }
}

function describeAxiosError(err: unknown): unknown {
  if (axios.isAxiosError(err)) {
    return { status: err.response?.status, code: (err.response?.data as ApiErrorBody | undefined)?.error?.code, message: err.message };
  }
  return err instanceof Error ? err.message : err;
}

apiClient.interceptors.response.use(
  (response) => {
    const meta = response.config._meta;
    logger.debug(
      'api',
      `← ${response.status} ${(response.config.method ?? 'get').toUpperCase()} ${response.config.url}`,
      { durationMs: meta ? Date.now() - meta.startedAt : undefined },
      meta?.requestId,
    );
    return response;
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const requestId = original?._meta?.requestId ?? original?.headers?.['x-request-id'] as string | undefined;
    const durationMs = original?._meta ? Date.now() - original._meta.startedAt : undefined;

    logger.warn(
      'api',
      `✕ ${error.response?.status ?? 'network'} ${(original?.method ?? 'get').toUpperCase()} ${original?.url}`,
      { durationMs, code: error.response?.data?.error?.code, message: error.message },
      requestId,
    );

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(requestId ?? generateRequestId()).finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        logger.debug('api', `↻ retrying after refresh: ${original.method?.toUpperCase()} ${original.url}`, undefined, requestId);
        return apiClient(original);
      }

      logger.error('api', 'Session expired — forcing sign-out', undefined, requestId);
      onSessionExpired?.();
    }

    const body = error.response?.data;
    if (body && body.success === false) {
      throw new ApiRequestError(error.response!.status, body.error.code, body.error.message, body.error.details, requestId);
    }
    throw new ApiRequestError(error.response?.status ?? 0, 'NETWORK_ERROR', error.message, undefined, requestId);
  },
);
