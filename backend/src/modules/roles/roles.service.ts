import {DataSource} from 'typeorm';
import {Role} from '../../domain/entities/role.entity';
import {Permission} from '../../domain/entities/permission.entity';
import {RolePermission} from '../../domain/entities/role-permission.entity';
import {UserRole} from '../../domain/entities/user-role.entity';
import {AclService} from '../acl/acl.service';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  isGlobal?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}

export class RolesService {
  constructor(
    private dataSource: DataSource,
    private aclService: AclService,
  ) {}

  /**
   * A society-scoped caller may only create roles scoped to their own
   * society. Creating a global role additionally requires the caller to
   * already hold at least one global role themselves — a society admin can
   * never mint a system-wide role for themselves or anyone else.
   */
  async create(societyId: number, actorUserId: number, input: CreateRoleInput): Promise<Role> {
    const repo = this.dataSource.getRepository(Role);

    let targetSocietyId: number | null = societyId;
    if (input.isGlobal) {
      const actorIsGlobalAdmin = await this.actorHasGlobalRole(actorUserId);
      if (!actorIsGlobalAdmin) {
        throw ApiError.forbidden('Only a global-role holder can create a global role', 'GLOBAL_ROLE_FORBIDDEN');
      }
      targetSocietyId = null;
    }

    const role = repo.create({
      society_id: targetSocietyId,
      name: input.name,
      description: input.description ?? null,
    });

    return repo.save(role);
  }

  /** Visible roles for a society: its own roles PLUS every global role. */
  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {search?: string; sort: string},
  ): Promise<{data: Role[]; total: number}> {
    const repo = this.dataSource.getRepository(Role);
    const qb = repo
      .createQueryBuilder('role')
      .where('(role.society_id = :societyId OR role.society_id IS NULL)', {societyId});

    if (filters.search) {
      qb.andWhere('role.name LIKE :search', {search: `%${filters.search}%`});
    }

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`role.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async findVisible(societyId: number, id: number): Promise<Role> {
    const repo = this.dataSource.getRepository(Role);
    const role = await repo.findOne({where: {id}});
    if (!role) throw ApiError.notFound('Role not found');
    if (role.society_id !== null && role.society_id !== societyId) {
      throw ApiError.notFound('Role not found'); // deliberately not 403 — don't confirm existence cross-tenant
    }
    return role;
  }

  async update(societyId: number, id: number, input: UpdateRoleInput): Promise<Role> {
    const role = await this.findVisible(societyId, id);
    if (role.society_id === null) {
      throw ApiError.forbidden('Global roles cannot be modified through the society API', 'GLOBAL_ROLE_READONLY');
    }

    if (input.name !== undefined) role.name = input.name;
    if (input.description !== undefined) role.description = input.description;

    const saved = await this.dataSource.getRepository(Role).save(role);
    this.aclService.invalidateAllCaches();
    return saved;
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const role = await this.findVisible(societyId, id);
    if (role.society_id === null) {
      throw ApiError.forbidden('Global roles cannot be deleted through the society API', 'GLOBAL_ROLE_READONLY');
    }
    await this.dataSource.getRepository(Role).softDelete(role.id);
    await this.dataSource.getRepository(UserRole).delete({role_id: role.id});
    this.aclService.invalidateAllCaches();
  }

  async assignPermission(societyId: number, roleId: number, permissionId: number): Promise<void> {
    const role = await this.findVisible(societyId, roleId);
    const permission = await this.dataSource.getRepository(Permission).findOne({where: {id: permissionId}});
    if (!permission) throw ApiError.notFound('Permission not found');

    const repo = this.dataSource.getRepository(RolePermission);
    const existing = await repo.findOne({where: {role_id: role.id, permission_id: permission.id}});
    if (!existing) {
      await repo.save(repo.create({role_id: role.id, permission_id: permission.id}));
    }

    this.aclService.invalidateAllCaches();
    logger.info('Permission assigned to role', {roleId: role.id, permissionId: permission.id});
  }

  async removePermission(societyId: number, roleId: number, permissionId: number): Promise<void> {
    const role = await this.findVisible(societyId, roleId);
    await this.dataSource.getRepository(RolePermission).delete({role_id: role.id, permission_id: permissionId});
    this.aclService.invalidateAllCaches();
  }

  async listPermissions(societyId: number, roleId: number): Promise<Permission[]> {
    const role = await this.findVisible(societyId, roleId);
    const rows = await this.dataSource.getRepository(RolePermission).find({
      where: {role_id: role.id},
      relations: ['permission'],
    });
    return rows.map((r) => r.permission);
  }

  private async actorHasGlobalRole(actorUserId: number): Promise<boolean> {
    const count = await this.dataSource
      .createQueryBuilder()
      .select('1')
      .from(UserRole, 'ur')
      .innerJoin(Role, 'r', 'r.id = ur.role_id')
      .where('ur.user_id = :actorUserId', {actorUserId})
      .andWhere('r.society_id IS NULL')
      .getCount();
    return count > 0;
  }
}
