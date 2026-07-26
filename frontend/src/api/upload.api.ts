import { apiClient } from './apiClient';

export const uploadApi = {
  resume: (file: File) => apiClient.uploadFile('/upload/resume', file),
  marksheet: (file: File) => apiClient.uploadFile('/upload/marksheet', file),
  avatar: (file: File) => apiClient.uploadFile('/upload/avatar', file),
  logo: (file: File) => apiClient.uploadFile('/upload/logo', file),
};
