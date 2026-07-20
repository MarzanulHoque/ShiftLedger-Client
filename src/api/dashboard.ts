import { apiClient } from './client';
import type { AdminDashboardDto, MyDashboardDto } from './types';

export function getAdminDashboard(date?: string) {
  return apiClient.get<AdminDashboardDto>('/dashboard/admin', { params: { date } }).then((r) => r.data);
}

export function getMyDashboard() {
  return apiClient.get<MyDashboardDto>('/dashboard/me').then((r) => r.data);
}
