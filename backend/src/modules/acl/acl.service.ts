import {DataSource, In, IsNull} from 'typeorm';
import {Role} from '../../domain/entities/role.entity';
import {UserRole} from '../../domain/entities/user-role.entity';
import {User} from '../../domain/entities/user.entity';
import {permissionCache} from './permission-cache';
import {logger} from '../../infrastructure/logging/logger';
import {config} from '../../config/env.config';

export class ForbiddenRoleAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenRoleAssignmentError';
  }
}

export class AclService {
  constructor(private dataSource: DataSource) {}

  /**
   * Loads (and caches) the full set of `resource.action` permission names a
   * user holds, resolved via ALL of their assigned roles.
   *
   * Global roles (society_id IS NULL) and society-scoped roles are both
   * honored — a user only ever has roles that were validated at assignment
   * time to belong to their own society or be global (see assignRole below),
   * so no additional society filtering is needed here.
   */
  async getUserPermissions(userId: number, societyId: number): Promise<Set<string>> {
    const cached = permissionCache.get(userId, societyId);
    if (cached) return cached;

    const rows: {name: string}[] = await this.dataSource
      .createQueryBuilder()
      .select('DISTINCT p.name', 'name')
      .from(UserRole, 'ur')
      .innerJoin(Role, 'r', 'r.id = ur.role_id')
      .innerJoin('role_permissions', 'rp', 'rp.role_id = r.id')
      .innerJoin('permissions', 'p', 'p.id = rp.permission_id')
      .where('ur.user_id = :userId', {userId})
      .andWhere('r.deleted_at IS NULL')
      .getRawMany();

    const permissions = new Set(rows.map((r) => r.name));
    permissionCache.set(userId, societyId, permissions);
    return permissions;
  }

  async hasPermission(userId: number, societyId: number, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, societyId);
    return permissions.has(permission);
  }

  async hasAnyPermission(userId: number, societyId: number, permissionList: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, societyId);
    return permissionList.some((p) => permissions.has(p));
  }

  /**
   * Assigns a role to a user, enforcing the business rule that a role must
   * either be global (society_id NULL) or belong to the SAME society as the
   * user. Never trusts a caller-supplied society_id for this check — it
   * always re-derives the user's own society from the database.
   */
  async assignRole(userId: number, roleId: number, actorUserId: number): Promise<void> {
    const userRepo = this.dataSource.getRepository(User);
    const roleRepo = this.dataSource.getRepository(Role);
    const userRoleRepo = this.dataSource.getRepository(UserRole);

    const user = await userRepo.findOne({where: {id: userId}});
    if (!user) throw new Error('User not found');

    const role = await roleRepo.findOne({where: {id: roleId}});
    if (!role) throw new Error('Role not found');

    if (role.society_id !== null && role.society_id !== user.society_id) {
      throw new ForbiddenRoleAssignmentError(
        'Cannot assign a role that belongs to a different society unless it is a global role',
      );
    }

    const existing = await userRoleRepo.findOne({where: {user_id: userId}});
    // const existing = await userRoleRepo.findOne({where: {user_id: userId,role_id: roleId}});
    // if (existing) return; // idempotent

    await userRoleRepo.save(userRoleRepo.create({id:existing?.id,user_id: userId, role_id: roleId}));
    permissionCache.invalidateUser(userId, user.society_id);

    logger.info('Role assigned', {actorUserId, userId, roleId, societyId: user.society_id});
  }

  async removeRole(userId: number, roleId: number, actorUserId: number): Promise<void> {
    const userRepo = this.dataSource.getRepository(User);
    const userRoleRepo = this.dataSource.getRepository(UserRole);

    const user = await userRepo.findOne({where: {id: userId}});
    if (!user) throw new Error('User not found');

    await userRoleRepo.delete({user_id: userId, role_id: roleId});
    permissionCache.invalidateUser(userId, user.society_id);

    logger.info('Role removed', {actorUserId, userId, roleId, societyId: user.society_id});
  }

  async getRoleName(roleIds: number[]): Promise<string[]> {
    const roleRepo = this.dataSource.getRepository(Role);
    const roles = await roleRepo.find({where: {id: In(roleIds), society_id: IsNull()}, select: ['name']});
    const names = roles.map((r) => r.name);
    return names;
  }

  isSupperAdmin(roleType: string[]): boolean {
    if (roleType.includes(config.supperAdminCode)) {
      return true;
    } else {
      return false;
    }
  }

  /** Call after any role_permissions mutation — cheap and correct beats clever. */
  invalidateAllCaches(): void {
    permissionCache.invalidateAll();
  }
}
