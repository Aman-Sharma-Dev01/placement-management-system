import { apiClient } from './apiClient';
import { Company } from '../types';

export const companiesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<Company[]>(`/companies${query}`);
  },

  getById: (id: string) => apiClient.get<Company>(`/companies/${id}`),

  create: (data: Partial<Company>) => apiClient.post<Company>('/companies', data),

  update: (id: string, data: Partial<Company>) =>
    apiClient.put<Company>(`/companies/${id}`, data),
};
