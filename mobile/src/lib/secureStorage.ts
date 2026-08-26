import * as SecureStore from 'expo-secure-store';

/**
 * Thin wrapper around expo-secure-store, which persists to iOS Keychain /
 * Android Keystore (not AsyncStorage) — this is where the access & refresh
 * tokens returned by POST /auth/login live. Never put tokens in Zustand's
 * persisted state or plain storage.
 */
const ACCESS_TOKEN_KEY = 'sl_access_token';
const REFRESH_TOKEN_KEY = 'sl_refresh_token';

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async setAccessToken(accessToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
