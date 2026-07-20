import { apiClient } from './client';
import type { AuthResult } from './types';

export function login(email: string, password: string) {
  return apiClient.post<AuthResult>('/auth/login', { email, password }).then((r) => r.data);
}

export function forgotPassword(email: string) {
  return apiClient.post('/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string) {
  return apiClient.post('/auth/reset-password', { token, newPassword });
}
