import { apiClient } from './apiClient';
import { Application, ApplicationStatus } from '../types';

export const applicationsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiClient.get<Application[]>(`/applications${query}`);
  },

  apply: (driveId: string, selectedResumeId: string) =>
    apiClient.post<Application>('/applications', { driveId, selectedResumeId }),

  updateStage: (id: string, stageId: string, status: ApplicationStatus, feedback?: string) =>
    apiClient.patch<Application>(`/applications/${id}/stage`, { stageId, status, feedback }),
};
