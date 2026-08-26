import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { secureStorage } from '../lib/secureStorage';
import { ApiErrorBody, ApiRequestError } from './types';

// API_PREFIX on the backend defaults to /api/v1 (backend/src/config/env.config.ts).
// Set the real host in app.json -> expo.extra.apiBaseUrl (or via EXPO_PUBLIC_API_BASE_URL).
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

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

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- 401 handling: refresh once, replay the request, or force logout ----
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    // Deliberately a bare axios call, not apiClient, to avoid recursing
    // through this same interceptor.
    const res = await axios.post<{ success: true; data: { accessToken: string; refreshToken: string } }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
    await secureStorage.setTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch {
    await secureStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      }

      onSessionExpired?.();
    }

    const body = error.response?.data;
    if (body && body.success === false) {
      throw new ApiRequestError(error.response!.status, body.error.code, body.error.message, body.error.details);
    }
    throw new ApiRequestError(error.response?.status ?? 0, 'NETWORK_ERROR', error.message);
  },
);
