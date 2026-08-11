import {DataSource, EntityManager} from 'typeorm';
import {Notification, NotificationChannelType} from '../../domain/entities/notification.entity';
import {User} from '../../domain/entities/user.entity';
import {NotificationChannel} from './channels/notification-channel.interface';
import {InAppNotificationChannel} from './channels/in-app.channel';
import {EmailNotificationChannel} from './channels/email.channel';
import {SmsNotificationChannel} from './channels/sms.channel';
import {PushNotificationChannel} from './channels/push.channel';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateNotificationInput {
  societyId: number;
  userId: number;
  type: string;
  title: string;
  body?: string | null;
  channel?: NotificationChannelType;
}

/**
 * The single reusable entry point other modules call into — spec section 16
 * ("Do not require every module to manually insert notifications"). Persists
 * the notification row, then dispatches through the appropriate
 * NotificationChannel. Accepts an optional EntityManager so callers running
 * inside their own transaction (e.g. HallBookingsService.transitionStatus)
 * can have notification creation roll back together with the rest of their
 * operation.
 */
export class NotificationService {
  private channels: Record<NotificationChannelType, NotificationChannel>;

  constructor(private dataSource: DataSource) {
    this.channels = {
      [NotificationChannelType.IN_APP]: new InAppNotificationChannel(),
      [NotificationChannelType.EMAIL]: new EmailNotificationChannel(),
      [NotificationChannelType.SMS]: new SmsNotificationChannel(),
      [NotificationChannelType.PUSH]: new PushNotificationChannel(),
    };
  }

  /**
   * Verifies the target user actually belongs to `societyId` before ever
   * writing a notification row. Internal callers (HallBookingsService,
   * AnnouncementsService) already source userId from a society-scoped
   * query, so this is a no-op safety net for them — but for the public
   * `POST /notifications` endpoint, where userId comes straight from the
   * request body, this is the ONLY thing stopping a caller in Society A
   * from writing a notification addressed to a user in Society B.
   */
  private async assertUserBelongsToSociety(societyId: number, userId: number, manager?: EntityManager): Promise<void> {
    const user = await (manager ?? this.dataSource).getRepository(User).findOne({where: {id: userId}});
    if (!user) throw ApiError.badRequest('Target user not found', 'USER_NOT_FOUND');
    if (user.society_id !== societyId) {
      throw ApiError.forbidden('Target user belongs to a different society', 'USER_SOCIETY_MISMATCH');
    }
  }

  async create(input: CreateNotificationInput, manager?: EntityManager): Promise<Notification> {
    await this.assertUserBelongsToSociety(input.societyId, input.userId, manager);

    const repo = (manager ?? this.dataSource).getRepository(Notification);

    const notification = repo.create({
      society_id: input.societyId,
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      channel: input.channel ?? NotificationChannelType.IN_APP,
      is_read: false,
    });
    const saved = await repo.save(notification);

    const channel = this.channels[saved.channel];
    try {
      await channel.send(saved);
    } catch (err) {
      // Delivery failure on an external channel must never roll back the
      // notification record itself, and must never break the caller's
      // primary operation (e.g. a booking approval) — log and move on.
      logger.error('Notification channel send failed', {
        notificationId: saved.id,
        channel: saved.channel,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    logger.info('Notification created', {
      societyId: input.societyId,
      userId: input.userId,
      notificationId: saved.id,
      type: input.type,
      channel: saved.channel,
    });

    return saved;
  }

  /**
   * Ownership-enforcing fetch: a notification is only visible to the user
   * it belongs to, UNLESS `allowAnyInSociety` is true (granted only when the
   * caller holds `notifications.view_all` — see notification.controller.ts).
   * Cross-society access is never allowed regardless of that flag.
   */
  async findById(societyId: number, userId: number, id: number, allowAnyInSociety: boolean): Promise<Notification> {
    const repo = this.dataSource.getRepository(Notification);
    const where = allowAnyInSociety ? {id, society_id: societyId} : {id, society_id: societyId, user_id: userId};
    const notification = await repo.findOne({where});
    if (!notification) throw ApiError.notFound('Notification not found');
    return notification;
  }

  async list(
    societyId: number,
    userId: number,
    allowAnyInSociety: boolean,
    pagination: PaginationQuery,
    filters: {isRead?: boolean; type?: string; targetUserId?: number; sort: string},
  ): Promise<{data: Notification[]; total: number}> {
    const repo = this.dataSource.getRepository(Notification);
    const qb = repo.createQueryBuilder('notification').where('notification.society_id = :societyId', {societyId});

    if (allowAnyInSociety) {
      // An admin may optionally narrow to one user's notifications; absent
      // that filter they see the whole society's.
      if (filters.targetUserId) {
        qb.andWhere('notification.user_id = :targetUserId', {targetUserId: filters.targetUserId});
      }
    } else {
      qb.andWhere('notification.user_id = :userId', {userId});
    }

    if (filters.isRead !== undefined) qb.andWhere('notification.is_read = :isRead', {isRead: filters.isRead});
    if (filters.type) qb.andWhere('notification.type = :type', {type: filters.type});

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`notification.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async markRead(societyId: number, userId: number, id: number, allowAnyInSociety: boolean): Promise<Notification> {
    const notification = await this.findById(societyId, userId, id, allowAnyInSociety);
    if (!notification.is_read) {
      notification.is_read = true;
      await this.dataSource.getRepository(Notification).save(notification);
    }
    return notification;
  }

  /** Always scoped to the CALLING user's own notifications — bulk "read all" never touches other users' rows. */
  async markAllRead(societyId: number, userId: number): Promise<number> {
    const result = await this.dataSource
      .getRepository(Notification)
      .createQueryBuilder()
      .update(Notification)
      .set({is_read: true})
      .where('society_id = :societyId', {societyId})
      .andWhere('user_id = :userId', {userId})
      .andWhere('is_read = false')
      .execute();

    return result.affected ?? 0;
  }

  async update(
    societyId: number,
    userId: number,
    id: number,
    allowAnyInSociety: boolean,
    input: {title?: string; body?: string | null},
  ): Promise<Notification> {
    const notification = await this.findById(societyId, userId, id, allowAnyInSociety);
    if (input.title !== undefined) notification.title = input.title;
    if (input.body !== undefined) notification.body = input.body;
    return this.dataSource.getRepository(Notification).save(notification);
  }

  async softDelete(societyId: number, userId: number, id: number, allowAnyInSociety: boolean): Promise<void> {
    const notification = await this.findById(societyId, userId, id, allowAnyInSociety);
    await this.dataSource.getRepository(Notification).softDelete(notification.id);
  }
}
