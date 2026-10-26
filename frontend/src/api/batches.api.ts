import { apiClient } from './apiClient';

export interface Batch {
  _id: string;
  id?: string;
  name: string;
  passingYear: number;
  admissionYear: number;
  program: string;
  description: string;
  isEnrollmentOpen: boolean;
  enrollmentOpenedAt?: string;
  enrollmentClosedAt?: string;
  totalStudentsCount: number;
  enrolledStudentsCount: number;
  placedStudentsCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface BatchAnalytics {
  batch: Batch;
  summary: {
    totalEnrolled: number;
    totalPlaced: number;
    totalUnplaced: number;
    totalApplied: number;
    notApplied: number;
    totalDrives: number;
    totalApplications: number;
    avgCtc: number;
    highestCtc: number;
    lowestCtc: number;
    placementRate: number;
  };
  branchWise: { branch: string; total: number; placed: number; applied: number }[];
  companyWise: { company: string; count: number; avgCtc: number }[];
  salaryBrackets: { range: string; count: number }[];
  drives: any[];
  placedStudents: { _id: string; name: string; email: string; rollNo: string; branch: string; batchYear: number }[];
  unplacedStudents: { _id: string; name: string; email: string; rollNo: string; branch: string; batchYear: number }[];
  notAppliedStudents: { _id: string; name: string; email: string; rollNo: string; branch: string; batchYear: number }[];
}

export const batchesApi = {
  getAll: () => apiClient.get<Batch[]>('/batches'),

  create: (data: Partial<Batch>) => apiClient.post<Batch>('/batches', data),

  update: (id: string, data: Partial<Batch>) => apiClient.put<Batch>(`/batches/${id}`, data),

  toggleEnrollment: (id: string) => apiClient.patch<Batch>(`/batches/${id}/toggle-enrollment`, {}),

  enroll: (id: string) => apiClient.post<{ message: string; batch: Batch }>(`/batches/${id}/enroll`, {}),

  getAnalytics: (id: string) => apiClient.get<BatchAnalytics>(`/batches/${id}/analytics`),
};
