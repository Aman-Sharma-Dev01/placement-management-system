import { apiClient } from './apiClient';
import { PlacementDrive } from '../types';

export const drivesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<PlacementDrive[]>(`/drives${query}`);
  },

  getById: (id: string) => apiClient.get<PlacementDrive>(`/drives/${id}`),

  create: (data: Partial<PlacementDrive>) =>
    apiClient.post<PlacementDrive>('/drives', data),

  update: (id: string, data: Partial<PlacementDrive>) =>
    apiClient.put<PlacementDrive>(`/drives/${id}`, data),

  delete: (id: string) => apiClient.delete<{ message: string }>(`/drives/${id}`),
};
