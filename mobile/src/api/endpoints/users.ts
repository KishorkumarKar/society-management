import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, SafeUser, Permission } from '../types';

// Matches backend/src/modules/users/users.controller.ts route table and
// users.validators.ts exactly:
//   POST   /users                (users.create)
//   GET    /users                (users.view)
//   GET    /users/:id            (users.view)
//   PATCH  /users/:id            (users.update)
//   DELETE /users/:id            (users.delete)
//   GET    /users/:id/permissions(users.view)
//   POST   /users/:id/roles      (users.assign_role)
//   DELETE /users/:id/roles/:roleId (users.assign_role)
//
// Request bodies are camelCase (isActive, flatId, roleIds) — same casing as
// the response, since User is the one entity with a safe-serializer
// (toSafeJSON()) that returns camelCase. See api/types.ts's header comment.

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listUsers(params: ListUsersParams = {}) {
  const res = await apiClient.get<ApiPaginated<SafeUser>>('/users', { params });
  return res.data;
}

export async function getUser(id: number) {
  const res = await apiClient.get<ApiSuccess<SafeUser>>(`/users/${id}`);
  return res.data.data;
}

export interface CreateUserPayload {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  flatId?: number | null;
  roleIds?: number[];
}

export async function createUser(payload: CreateUserPayload) {
  const res = await apiClient.post<ApiSuccess<SafeUser>>('/users', payload);
  return res.data.data;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  flatId?: number | null;
  isActive?: boolean;
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  const res = await apiClient.patch<ApiSuccess<SafeUser>>(`/users/${id}`, payload);
  return res.data.data;
}

export async function deleteUser(id: number) {
  await apiClient.delete(`/users/${id}`);
}

export async function getUserPermissions(id: number) {
  const res = await apiClient.get<ApiSuccess<Permission[]>>(`/users/${id}/permissions`);
  return res.data.data;
}

export async function assignRole(userId: number, roleId: number) {
  await apiClient.post(`/users/${userId}/roles`, { roleId });
}

export async function removeRole(userId: number, roleId: number) {
  await apiClient.delete(`/users/${userId}/roles/${roleId}`);
}
