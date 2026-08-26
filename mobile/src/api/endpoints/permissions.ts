import { apiClient } from '../client';
import { ApiSuccess, Permission } from '../types';

// backend/src/modules/permissions/permissions.controller.ts:
//   GET /permissions (permissions.view)   POST /permissions (super-admin seed use)
export async function listPermissions() {
  const res = await apiClient.get<ApiSuccess<Permission[]>>('/permissions');
  return res.data.data;
}
