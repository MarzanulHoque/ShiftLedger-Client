import { apiClient } from './client';
import type { Role, UserDto } from './types';

export function getUsers() {
  return apiClient.get<UserDto[]>('/users').then((r) => r.data);
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  departmentId?: string | null;
}

export function createUser(request: CreateUserRequest) {
  return apiClient.post<string>('/users', request).then((r) => r.data);
}

export interface UpdateUserRequest {
  id: string;
  fullName: string;
  role: Role;
  departmentId?: string | null;
  isActive: boolean;
}

export function updateUser(id: string, request: UpdateUserRequest) {
  return apiClient.put(`/users/${id}`, request);
}

export function deleteUser(id: string) {
  return apiClient.delete(`/users/${id}`);
}
