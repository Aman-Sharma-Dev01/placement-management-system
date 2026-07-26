import { apiClient } from './apiClient';
import { Student, VerificationStatus } from '../types';

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  pages: number;
}

export const studentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<StudentsResponse>(`/students${query}`);
  },

  getById: (id: string) => apiClient.get<Student>(`/students/${id}`),

  getMyProfile: () => apiClient.get<Student>('/students/me'),

  update: (id: string, data: Partial<Student>) =>
    apiClient.put<Student>(`/students/${id}`, data),

  verify: (id: string, status: VerificationStatus, remarks?: string) =>
    apiClient.patch<Student>(`/students/${id}/verify`, { status, remarks }),

  bulkVerify: (studentIds: string[], status: VerificationStatus) =>
    apiClient.patch<{ message: string }>('/students/bulk-verify', { studentIds, status }),
};
