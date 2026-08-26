import { apiClient } from '../client';
import { ApiSuccess, LoginResponseData } from '../types';

/**
 * Login is by society SLUG + email-or-phone + password (backend/src/modules
 * /auth/auth.service.ts). There is no separate "current user" endpoint —
 * login already returns user, society, roles and the full permission list,
 * which is everything the app needs to boot the authenticated shell.
 */
export interface LoginPayload {
  society: string;
  email?: string;
  phone?: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponseData> {
  const res = await apiClient.post<ApiSuccess<LoginResponseData>>('/auth/login', payload);
  return res.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}
