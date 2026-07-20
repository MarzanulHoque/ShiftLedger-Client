import { apiClient } from './client';
import type { NotificationDto, PagedResult } from './types';

export interface GetNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export function getNotifications(params: GetNotificationsParams = {}) {
  return apiClient.get<PagedResult<NotificationDto>>('/notifications', { params }).then((r) => r.data);
}

export function markNotificationRead(id: string) {
  return apiClient.patch(`/notifications/${id}/read`);
}
