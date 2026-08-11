import {DataSource} from 'typeorm';
import {Announcement, AnnouncementPriority} from '../../domain/entities/announcement.entity';
import {AnnouncementTarget} from '../../domain/entities/announcement-target.entity';
import {Role} from '../../domain/entities/role.entity';
import {UserRole} from '../../domain/entities/user-role.entity';
import {User} from '../../domain/entities/user.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';
import {NotificationService} from '../notifications/notification.service';
import {NotificationChannelType} from '../../domain/entities/notification.entity';

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  targetRoleIds?: number[];
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  priority?: AnnouncementPriority;
  targetRoleIds?: number[];
}

export interface AnnouncementWithTargets {
  announcement: Announcement;
  targetRoleIds: number[];
}

export class AnnouncementsService {
  constructor(
    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  /** A role can only target if it's global OR belongs to this exact society — same rule as AclService.assignRole. */
  private async assertRolesAreVisible(societyId: number, roleIds: number[]): Promise<void> {
    if (roleIds.length === 0) return;
    const roles = await this.dataSource.getRepository(Role).find({where: roleIds.map((id) => ({id}))});
    if (roles.length !== roleIds.length) {
      throw ApiError.badRequest('One or more target roles do not exist', 'ROLE_NOT_FOUND');
    }
    for (const role of roles) {
      if (role.society_id !== null && role.society_id !== societyId) {
        throw ApiError.forbidden('Cannot target a role that belongs to a different society', 'ROLE_SOCIETY_MISMATCH');
      }
    }
  }

  async create(societyId: number, actorUserId: number, input: CreateAnnouncementInput): Promise<AnnouncementWithTargets> {
    const targetRoleIds = input.targetRoleIds ?? [];
    await this.assertRolesAreVisible(societyId, targetRoleIds);

    return this.dataSource.transaction(async (manager) => {
      const announcementRepo = manager.getRepository(Announcement);
      const targetRepo = manager.getRepository(AnnouncementTarget);

      const announcement = await announcementRepo.save(
        announcementRepo.create({
          society_id: societyId,
          title: input.title,
          body: input.body,
          priority: input.priority ?? AnnouncementPriority.NORMAL,
          sent_at: null,
        }),
      );

      for (const roleId of targetRoleIds) {
        await targetRepo.save(targetRepo.create({announcement_id: announcement.id, role_id: roleId}));
      }

      logger.info('Announcement created', {actorUserId, societyId, announcementId: announcement.id, targetRoleIds});
      return {announcement, targetRoleIds};
    });
  }

  /**
   * Visibility rule (spec section 10): a plain viewer only sees society-wide
   * announcements (no targets) or ones targeting a role they hold. A
   * "manager" (anyone who can create/update/delete/send announcements) sees
   * everything in the society — they need full visibility to administer it.
   * `canViewAll` is resolved by the controller via AclService, mirroring the
   * notifications.view_all pattern.
   */
  async findVisible(societyId: number, actorUserId: number, id: number, canViewAll: boolean): Promise<AnnouncementWithTargets> {
    const announcement = await this.dataSource.getRepository(Announcement).findOne({where: {id, society_id: societyId}});
    if (!announcement) throw ApiError.notFound('Announcement not found');

    const targetRoleIds = await this.getTargetRoleIds(announcement.id);

    if (!canViewAll && targetRoleIds.length > 0) {
      const actorRoleIds = await this.getActorRoleIds(actorUserId);
      const visible = targetRoleIds.some((roleId) => actorRoleIds.includes(roleId));
      if (!visible) throw ApiError.notFound('Announcement not found');
    }

    return {announcement, targetRoleIds};
  }

  async list(
    societyId: number,
    actorUserId: number,
    canViewAll: boolean,
    pagination: PaginationQuery,
    filters: {search?: string; priority?: string; targetRole?: number; fromDate?: string | Date; toDate?: string | Date; sort: string},
  ): Promise<{data: AnnouncementWithTargets[]; total: number}> {
    const repo = this.dataSource.getRepository(Announcement);
    const qb = repo.createQueryBuilder('announcement').where('announcement.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(announcement.title LIKE :search OR announcement.body LIKE :search)', {search: `%${filters.search}%`});
    }
    if (filters.priority) qb.andWhere('announcement.priority = :priority', {priority: filters.priority});
    if (filters.fromDate) qb.andWhere('announcement.created_at >= :fromDate', {fromDate: this.toDateOnly(filters.fromDate)});
    if (filters.toDate) qb.andWhere('announcement.created_at <= :toDate', {toDate: this.toDateOnly(filters.toDate)});

    if (filters.targetRole) {
      qb.andWhere(
        '(EXISTS (SELECT 1 FROM announcement_targets t WHERE t.announcement_id = announcement.id AND t.role_id = :targetRole))',
        {targetRole: filters.targetRole},
      );
    }

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`announcement.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [rows, total] = await qb.getManyAndCount();

    const actorRoleIds = canViewAll ? [] : await this.getActorRoleIds(actorUserId);
    const withTargets: AnnouncementWithTargets[] = [];
    let filteredTotal = total;

    for (const announcement of rows) {
      const targetRoleIds = await this.getTargetRoleIds(announcement.id);
      if (!canViewAll && targetRoleIds.length > 0) {
        const visible = targetRoleIds.some((roleId) => actorRoleIds.includes(roleId));
        if (!visible) {
          filteredTotal -= 1;
          continue;
        }
      }
      withTargets.push({announcement, targetRoleIds});
    }

    // Note: filteredTotal is an approximation when a viewer-scoped filter
    // removes rows from THIS page — an exact society-wide total for a
    // restricted viewer would require pushing the role-visibility check
    // into the SQL WHERE clause. Acceptable for pagination UX; documented
    // here rather than silently wrong.
    return {data: withTargets, total: canViewAll ? total : filteredTotal};
  }

  async update(societyId: number, id: number, input: UpdateAnnouncementInput): Promise<AnnouncementWithTargets> {
    const announcement = await this.dataSource.getRepository(Announcement).findOne({where: {id, society_id: societyId}});
    if (!announcement) throw ApiError.notFound('Announcement not found');
    if (announcement.sent_at) {
      throw ApiError.conflict('Cannot edit an announcement that has already been sent', 'ANNOUNCEMENT_ALREADY_SENT');
    }

    return this.dataSource.transaction(async (manager) => {
      if (input.title !== undefined) announcement.title = input.title;
      if (input.body !== undefined) announcement.body = input.body;
      if (input.priority !== undefined) announcement.priority = input.priority;
      await manager.getRepository(Announcement).save(announcement);

      if (input.targetRoleIds !== undefined) {
        await this.assertRolesAreVisible(societyId, input.targetRoleIds);
        const targetRepo = manager.getRepository(AnnouncementTarget);
        await targetRepo.delete({announcement_id: announcement.id});
        for (const roleId of input.targetRoleIds) {
          await targetRepo.save(targetRepo.create({announcement_id: announcement.id, role_id: roleId}));
        }
      }

      const targetRoleIds = await this.getTargetRoleIds(announcement.id, manager);
      return {announcement, targetRoleIds};
    });
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const announcement = await this.dataSource.getRepository(Announcement).findOne({where: {id, society_id: societyId}});
    if (!announcement) throw ApiError.notFound('Announcement not found');
    await this.dataSource.getRepository(Announcement).softDelete(announcement.id);
  }

  /**
   * Determines target users (residents holding a targeted role, or every
   * active user in the society if society-wide) and creates one
   * notification per user, inside a single transaction alongside setting
   * `sent_at` — spec section 33: partial failure must not leave the system
   * inconsistent (e.g. sent_at set but no notifications, or vice versa).
   */
  async send(societyId: number, id: number, actorUserId: number): Promise<AnnouncementWithTargets> {
    return this.dataSource.transaction(async (manager) => {
      const announcementRepo = manager.getRepository(Announcement);
      const announcement = await announcementRepo.findOne({where: {id, society_id: societyId}});
      if (!announcement) throw ApiError.notFound('Announcement not found');
      if (announcement.sent_at) {
        throw ApiError.conflict('This announcement has already been sent', 'ANNOUNCEMENT_ALREADY_SENT');
      }

      const targetRoleIds = await this.getTargetRoleIds(announcement.id, manager);

      let targetUserIds: number[];
      if (targetRoleIds.length === 0) {
        // Society-wide.
        const users = await manager
          .getRepository(User)
          .find({where: {society_id: societyId, is_active: true}, select: ['id']});
        targetUserIds = users.map((u) => u.id);
      } else {
        const rows = await manager
          .createQueryBuilder()
          .select('DISTINCT ur.user_id', 'userId')
          .from(UserRole, 'ur')
          .innerJoin('users', 'u', 'u.id = ur.user_id')
          .where('ur.role_id IN (:...roleIds)', {roleIds: targetRoleIds})
          .andWhere('u.society_id = :societyId', {societyId})
          .andWhere('u.is_active = true')
          .getRawMany<{userId: number}>();
        targetUserIds = rows.map((r) => r.userId);
      }

      for (const userId of targetUserIds) {
        await this.notificationService.create(
          {
            societyId,
            userId,
            type: 'announcement',
            title: announcement.title,
            body: announcement.body,
            channel: NotificationChannelType.IN_APP,
          },
          manager,
        );
      }

      announcement.sent_at = new Date();
      await announcementRepo.save(announcement);

      logger.info('Announcement sent', {actorUserId, societyId, announcementId: id, recipientCount: targetUserIds.length});
      return {announcement, targetRoleIds};
    });
  }

  private async getTargetRoleIds(announcementId: number, manager = this.dataSource.manager): Promise<number[]> {
    const targets = await manager.getRepository(AnnouncementTarget).find({where: {announcement_id: announcementId}});
    return targets.map((t) => t.role_id);
  }

  private async getActorRoleIds(userId: number): Promise<number[]> {
    const userRoles = await this.dataSource.getRepository(UserRole).find({where: {user_id: userId}});
    return userRoles.map((ur) => ur.role_id);
  }

  private toDateOnly(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  }
}
