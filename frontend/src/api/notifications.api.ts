import { apiClient } from './apiClient';
import { NotificationItem, NotificationFeed } from '../types';
import { normalizeNotification, normalizeNotifications } from '../utils/normalizers';

export const notificationsApi = {
  /**
   * Backend returns `{ notifications, unreadCount }`. The unread count comes
   * from the server so the bell badge is correct before the first paint.
   */
  getAll: (unreadOnly = false) =>
    apiClient
      .get<NotificationFeed>('/notifications', { params: { unreadOnly } })
      .then((feed: any) => ({
        notifications: normalizeNotifications(feed?.notifications || []),
        unreadCount: Number(feed?.unreadCount || 0),
      })),

  getUnreadCount: () =>
    apiClient
      .get<{ unreadCount: number }>('/notifications/unread-count')
      .then((res: any) => Number(res?.unreadCount || 0)),

  markAsRead: (id: string) =>
    apiClient
      .patch<NotificationItem>(`/notifications/${id}/read`, {})
      .then(normalizeNotification),

  markAllAsRead: () =>
    apiClient
      .patch<{ updated: number }>('/notifications/read-all', {})
      .then((res: any) => Number(res?.updated || 0)),
};
