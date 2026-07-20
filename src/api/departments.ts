import { apiClient } from './client';
import type { DepartmentDto } from './types';

export function getDepartments() {
  return apiClient.get<DepartmentDto[]>('/departments').then((r) => r.data);
}

export function createDepartment(name: string) {
  return apiClient.post<string>('/departments', { name }).then((r) => r.data);
}

export function updateDepartment(id: string, name: string) {
  return apiClient.put(`/departments/${id}`, { id, name });
}

export function deleteDepartment(id: string) {
  return apiClient.delete(`/departments/${id}`);
}
