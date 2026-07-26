import { apiClient } from './apiClient';
import { NotificationItem } from '../types';

export const notificationsApi = {
  getAll: () => apiClient.get<NotificationItem[]>('/notifications'),
  markAsRead: (id: string) => apiClient.patch<NotificationItem>(`/notifications/${id}/read`, {}),
};
