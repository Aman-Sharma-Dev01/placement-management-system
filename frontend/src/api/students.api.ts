import { apiClient } from './apiClient';
import { Student, VerificationStatus } from '../types';
import { normalizeStudent, normalizeStudents } from '../utils/normalizers';

interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  pages: number;
}

export const studentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<StudentsResponse>(`/students${query}`).then((response) => ({
      ...response,
      students: normalizeStudents(response.students),
    }));
  },

  getById: (id: string) => apiClient.get<Student>(`/students/${id}`).then(normalizeStudent),

  getMyProfile: () => apiClient.get<Student>('/students/me').then(normalizeStudent),

  update: (id: string, data: Partial<Student>) =>
    apiClient.put<Student>(`/students/${id}`, data).then(normalizeStudent),

  verify: (id: string, status: VerificationStatus, remarks?: string) =>
    apiClient.patch<Student>(`/students/${id}/verify`, { status, remarks }).then(normalizeStudent),

  bulkVerify: (studentIds: string[], status: VerificationStatus) =>
    apiClient.patch<{ message: string }>('/students/bulk-verify', { studentIds, status }),
};
