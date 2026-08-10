import {config} from '../../config/env.config';

interface CacheEntry {
  permissions: Set<string>;
  expiresAt: number;
}

/**
 * Simple process-local TTL cache keyed by `userId:societyId`.
 *
 * This deliberately does NOT put permissions in the JWT (per spec: "do not
 * blindly put the entire permission list into the JWT if permissions can
 * change frequently"). Instead permissions are loaded once per TTL window
 * and explicitly invalidated the moment a role or role-permission mutation
 * happens for that user/role.
 *
 * In a horizontally-scaled deployment, swap this for a Redis-backed
 * implementation behind the same interface — the ACL service only depends
 * on get/set/invalidate, not on this being in-process.
 */
class PermissionCache {
  private store = new Map<string, CacheEntry>();

  private key(userId: number, societyId: number): string {
    return `${userId}:${societyId}`;
  }

  get(userId: number, societyId: number): Set<string> | null {
    const entry = this.store.get(this.key(userId, societyId));
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(this.key(userId, societyId));
      return null;
    }
    return entry.permissions;
  }

  set(userId: number, societyId: number, permissions: Set<string>): void {
    this.store.set(this.key(userId, societyId), {
      permissions,
      expiresAt: Date.now() + config.aclCacheTtlSeconds * 1000,
    });
  }

  /** Invalidate a single user's cached permissions (e.g. after role assignment changes). */
  invalidateUser(userId: number, societyId: number): void {
    this.store.delete(this.key(userId, societyId));
  }

  /**
   * Invalidate every cached user in a given role — used when a role's
   * permission set changes (roles.assign_permission / remove) since we
   * don't track role->user membership in the cache key itself.
   */
  invalidateAll(): void {
    this.store.clear();
  }
}

export const permissionCache = new PermissionCache();
