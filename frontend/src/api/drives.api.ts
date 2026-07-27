import { apiClient } from './apiClient';
import { PlacementDrive } from '../types';
import { normalizeDrive, normalizeDrives } from '../utils/normalizers';

export const drivesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<PlacementDrive[]>(`/drives${query}`).then(normalizeDrives);
  },

  getById: (id: string) => apiClient.get<PlacementDrive>(`/drives/${id}`).then(normalizeDrive),

  create: (data: Partial<PlacementDrive>) =>
    apiClient.post<PlacementDrive>('/drives', data).then(normalizeDrive),

  update: (id: string, data: Partial<PlacementDrive>) =>
    apiClient.put<PlacementDrive>(`/drives/${id}`, data).then(normalizeDrive),

  delete: (id: string) => apiClient.delete<{ message: string }>(`/drives/${id}`),
};
