import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Role, Permission } from '../types';

// backend/src/modules/roles/roles.controller.ts:
//   POST /roles  GET /roles  GET /roles/:id  PATCH /roles/:id  DELETE /roles/:id
//   GET /roles/:id/permissions  POST /roles/:id/permissions
//   DELETE /roles/:id/permissions/:permissionId
// permissions: roles.view / .create / .update / .delete / .assign_permission

export async function listRoles(params: { page?: number; limit?: number } = {}) {
  const res = await apiClient.get<ApiPaginated<Role>>('/roles', { params });
  return res.data;
}
export async function getRole(id: number) {
  const res = await apiClient.get<ApiSuccess<Role>>(`/roles/${id}`);
  return res.data.data;
}
export async function createRole(payload: { name: string; description?: string }) {
  const res = await apiClient.post<ApiSuccess<Role>>('/roles', payload);
  return res.data.data;
}
export async function updateRole(id: number, payload: Partial<{ name: string; description: string }>) {
  const res = await apiClient.patch<ApiSuccess<Role>>(`/roles/${id}`, payload);
  return res.data.data;
}
export async function deleteRole(id: number) {
  await apiClient.delete(`/roles/${id}`);
}
export async function getRolePermissions(id: number) {
  const res = await apiClient.get<ApiSuccess<Permission[]>>(`/roles/${id}/permissions`);
  return res.data.data;
}
export async function addRolePermission(roleId: number, permissionId: number) {
  await apiClient.post(`/roles/${roleId}/permissions`, { permissionId });
}
export async function removeRolePermission(roleId: number, permissionId: number) {
  await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
}
