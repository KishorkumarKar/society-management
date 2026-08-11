import {NotificationChannel} from './notification-channel.interface';
import {Notification} from '../../../domain/entities/notification.entity';
import {logger} from '../../../infrastructure/logging/logger';

/** Stub/log-only implementation — swap for Firebase FCM / AWS SNS later. */
export class PushNotificationChannel implements NotificationChannel {
  async send(notification: Notification): Promise<void> {
    logger.info('PushNotificationChannel (stub): would send push notification', {
      notificationId: notification.id,
      userId: notification.user_id,
      title: notification.title,
    });
    return Promise.resolve();
  }
}
