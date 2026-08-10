import {DataSource, EntityManager} from 'typeorm';
import {User} from '../../domain/entities/user.entity';
import {Society, SocietyStatus} from '../../domain/entities/society.entity';
import {Flat} from '../../domain/entities/flat.entity';
import {hashPassword} from '../auth/password.util';
import {AclService} from '../acl/acl.service';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateUserInput {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  flatId?: number | null;
  roleIds?: number[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  flatId?: number | null;
  isActive?: boolean;
}

export class UsersService {
  constructor(
    private dataSource: DataSource,
    private aclService: AclService,
  ) {}

  /**
   * Implements section 30 "User creation" business rules exactly:
   *   1. Requester authentication + 2. permission are enforced by
   *      middleware upstream (authenticate + authorize(users.create)).
   *   3. society_id is taken ONLY from the authenticated requester's
   *      context (`societyId` param), never from the request body.
   *   4. Society must be active.
   *   5. Society user_limit must not be exceeded (active users only).
   *   6. email/phone uniqueness is scoped to the society (DB unique index
   *      is the ultimate guarantee; we pre-check for a friendlier error).
   *   7. If a flatId is supplied, that flat must belong to the same
   *      society — a flat from another society can never be attached.
   *   8. Password is hashed, never stored/logged in plaintext.
   *   9-10. User is created and (if roleIds given) roles are assigned,
   *      each individually re-validated by AclService.assignRole against
   *      the society-scoping rule.
   * All of this runs inside a single DB transaction: if role assignment
   * fails, the user creation itself is rolled back.
   */
  async create(societyId: number, actorUserId: number, input: CreateUserInput): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const societyRepo = manager.getRepository(Society);
      const society = await societyRepo.findOne({where: {id: societyId}});
      if (!society) throw ApiError.notFound('Society not found');
      if (society.status !== SocietyStatus.ACTIVE) {
        throw ApiError.forbidden('This society is not active', 'SOCIETY_INACTIVE');
      }

      const userRepo = manager.getRepository(User);
      const activeUserCount = await userRepo.count({where: {society_id: societyId, is_active: true}});
      if (society.user_limit > 0 && activeUserCount >= society.user_limit) {
        throw ApiError.conflict('Society user limit has been reached', 'USER_LIMIT_REACHED');
      }

      if (input.email) {
        const existing = await userRepo.findOne({where: {society_id: societyId, email: input.email}});
        if (existing) throw ApiError.conflict('A user with this email already exists in this society', 'EMAIL_TAKEN');
      }
      if (input.phone) {
        const existing = await userRepo.findOne({where: {society_id: societyId, phone: input.phone}});
        if (existing) throw ApiError.conflict('A user with this phone already exists in this society', 'PHONE_TAKEN');
      }

      let flatId: number | null = null;
      if (input.flatId) {
        const flat = await manager.getRepository(Flat).findOne({where: {id: input.flatId}});
        if (!flat) throw ApiError.badRequest('Flat not found', 'FLAT_NOT_FOUND');
        if (flat.society_id !== societyId) {
          throw ApiError.forbidden('Flat belongs to a different society', 'FLAT_SOCIETY_MISMATCH');
        }
        flatId = flat.id;
      }

      const passwordHash = await hashPassword(input.password);

      const user = userRepo.create({
        society_id: societyId,
        flat_id: flatId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        password_hash: passwordHash,
        is_active: true,
      });
      const saved = await userRepo.save(user);

      for (const roleId of input.roleIds ?? []) {
        // Runs against the transaction's own EntityManager (not a fresh
        // AclService/DataSource) so role assignment rolls back atomically
        // with the user creation if anything fails.
        await this.assignRoleWithinTransaction(manager, saved.id, roleId, actorUserId);
      }

      logger.info('User created', {actorUserId, newUserId: saved.id, societyId});
      return saved;
    });
  }

  /**
   * Role assignment logic duplicated (rather than reusing AclService)
   * specifically so it runs against the transaction's EntityManager and
   * rolls back atomically with user creation — see comment above.
   */
  private async assignRoleWithinTransaction(
    manager: EntityManager,
    userId: number,
    roleId: number,
    actorUserId: number,
  ): Promise<void> {
    const roleRepo = manager.getRepository('Role');
    const userRepo = manager.getRepository(User);
    const user = await userRepo.findOne({where: {id: userId}});
    const role = await roleRepo.findOne({where: {id: roleId}});
    if (!user || !role) throw ApiError.badRequest('Invalid role assignment');

    const roleEntity = role as unknown as {society_id: number | null};
    if (roleEntity.society_id !== null && roleEntity.society_id !== user.society_id) {
      throw ApiError.forbidden(
        'Cannot assign a role that belongs to a different society unless it is a global role',
        'ROLE_SOCIETY_MISMATCH',
      );
    }

    const userRoleRepo = manager.getRepository('UserRole');
    const existing = await userRoleRepo.findOne({where: {user_id: userId, role_id: roleId}});
    if (!existing) {
      await userRoleRepo.save(userRoleRepo.create({user_id: userId, role_id: roleId}));
    }
    void actorUserId;
  }

  async findById(societyId: number, id: number): Promise<User> {
    const repo = this.dataSource.getRepository(User);
    // society_id is always part of the WHERE clause — this is the tenant
    // isolation enforcement point for single-record reads. A user cannot
    // fetch another society's user by guessing an id.
    const user = await repo.findOne({where: {id, society_id: societyId}});
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {search?: string; isActive?: boolean; sort: string},
  ): Promise<{data: User[]; total: number}> {
    const repo = this.dataSource.getRepository(User);
    const qb = repo.createQueryBuilder('user').where('user.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search OR user.phone LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.isActive !== undefined) {
      qb.andWhere('user.is_active = :isActive', {isActive: filters.isActive});
    }

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`user.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async update(societyId: number, id: number, input: UpdateUserInput): Promise<User> {
    const user = await this.findById(societyId, id);
    const repo = this.dataSource.getRepository(User);

    if (input.flatId !== undefined) {
      if (input.flatId === null) {
        user.flat_id = null;
      } else {
        const flat = await this.dataSource.getRepository(Flat).findOne({where: {id: input.flatId}});
        if (!flat) throw ApiError.badRequest('Flat not found', 'FLAT_NOT_FOUND');
        if (flat.society_id !== societyId) {
          throw ApiError.forbidden('Flat belongs to a different society', 'FLAT_SOCIETY_MISMATCH');
        }
        user.flat_id = flat.id;
      }
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.email !== undefined) user.email = input.email;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.isActive !== undefined) user.is_active = input.isActive;

    return repo.save(user);
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const user = await this.findById(societyId, id);
    await this.dataSource.getRepository(User).softDelete(user.id);
  }

  async assignRole(societyId: number, userId: number, roleId: number, actorUserId: number): Promise<void> {
    // Re-confirm the target user actually belongs to the caller's society
    // before delegating to AclService — otherwise a caller could try to
    // assign a role to a user id belonging to a different society.
    await this.findById(societyId, userId);
    await this.aclService.assignRole(userId, roleId, actorUserId);
  }

  async removeRole(societyId: number, userId: number, roleId: number, actorUserId: number): Promise<void> {
    await this.findById(societyId, userId);
    await this.aclService.removeRole(userId, roleId, actorUserId);
  }

  async getUserPermissions(societyId: number, userId: number): Promise<string[]> {
    await this.findById(societyId, userId);
    const permissions = await this.aclService.getUserPermissions(userId, societyId);
    return Array.from(permissions);
  }
}
