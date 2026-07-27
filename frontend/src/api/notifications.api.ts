import { apiClient } from './apiClient';
import { NotificationItem } from '../types';
import { normalizeNotification, normalizeNotifications } from '../utils/normalizers';

export const notificationsApi = {
  getAll: () => apiClient.get<NotificationItem[]>('/notifications').then(normalizeNotifications),
  markAsRead: (id: string) => apiClient.patch<NotificationItem>(`/notifications/${id}/read`, {}).then(normalizeNotification),
};
