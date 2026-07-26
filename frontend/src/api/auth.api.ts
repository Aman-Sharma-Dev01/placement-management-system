import { apiClient } from './apiClient';

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
  category?: string;
  phone?: string;
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  token: string;
  studentProfile?: unknown;
}

export const authApi = {
  login: (data: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', data),
  getMe: () => apiClient.get<AuthResponse>('/auth/me'),
};
