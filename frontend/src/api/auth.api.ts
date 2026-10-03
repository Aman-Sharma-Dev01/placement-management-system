import { apiClient } from './apiClient';
import { NotificationPreferences } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
  rollNo?: string;
  branch?: string;
  department?: string;
  batchYear?: number;
  gender?: string;
  phone?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  token?: string;
  studentProfile?: unknown;
  needsOnboarding?: boolean;
  linkedExistingAccount?: boolean;
  notificationPreferences?: NotificationPreferences;
}

export const authApi = {
  login: (data: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', data),
  googleLogin: (credential: string) => apiClient.post<AuthResponse>('/auth/google', { credential }),
  getMe: () => apiClient.get<AuthResponse>('/auth/me'),

  /**
   * Always resolves to a message, whether or not the email has an account —
   * the backend deliberately does not reveal which. Never surface a "no such
   * user" error here.
   */
  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  validateResetToken: (token: string) =>
    apiClient
      .get<{ valid: boolean; reason: string }>(`/auth/reset-password/${encodeURIComponent(token)}`)
      .then((res: any) => ({ valid: Boolean(res?.valid), reason: res?.reason || 'unknown' })),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>(`/auth/reset-password/${encodeURIComponent(token)}`, {
      password,
    }),

  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) =>
    apiClient.patch<{ notificationPreferences: NotificationPreferences }>(
      '/auth/notification-preferences',
      preferences
    ),
};
