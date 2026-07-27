import { apiClient } from './apiClient';
import { Company } from '../types';
import { normalizeCompanies, normalizeCompany } from '../utils/normalizers';

export const companiesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<Company[]>(`/companies${query}`).then(normalizeCompanies);
  },

  getById: (id: string) => apiClient.get<Company>(`/companies/${id}`).then(normalizeCompany),

  create: (data: Partial<Company>) => apiClient.post<Company>('/companies', data).then(normalizeCompany),

  update: (id: string, data: Partial<Company>) =>
    apiClient.put<Company>(`/companies/${id}`, data).then(normalizeCompany),
};
