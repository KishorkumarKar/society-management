import React from 'react';
import { useAuthStore } from '../store/authStore';
import { PermissionName } from './permissions';

/**
 * Pure function so it can also be used outside React (e.g. to filter a
 * navigator's tab list before render). `permissions` is exactly the array
 * POST /auth/login returned — never derived from role names client-side.
 */
export function hasPermission(granted: string[], required: PermissionName | PermissionName[]): boolean {
  const list = Array.isArray(required) ? required : [required];
  return list.every((p) => granted.includes(p));
}

export function hasAnyPermission(granted: string[], required: PermissionName[]): boolean {
  return required.some((p) => granted.includes(p));
}

export function useHasPermission(required: PermissionName | PermissionName[]): boolean {
  const granted = useAuthStore((s) => s.permissions);
  return hasPermission(granted, required);
}

interface PermissionGateProps {
  /** One permission, or several — ALL are required unless `any` is set. */
  permission: PermissionName | PermissionName[];
  any?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hides UI the user isn't allowed to use. This is a UX convenience only:
 * removing a button here never removes the corresponding server-side check.
 * If the backend and this list ever disagree, the backend wins and the
 * request fails with a 403 that api/client surfaces normally.
 */
export function PermissionGate({ permission, any, fallback = null, children }: PermissionGateProps) {
  const granted = useAuthStore((s) => s.permissions);
  const required = Array.isArray(permission) ? permission : [permission];
  const allowed = any ? hasAnyPermission(granted, required) : hasPermission(granted, required);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
