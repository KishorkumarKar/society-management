import {NotificationChannel} from './notification-channel.interface';
import {Notification} from '../../../domain/entities/notification.entity';
import {logger} from '../../../infrastructure/logging/logger';

/** Stub/log-only implementation — swap for Twilio (or similar) later. */
export class SmsNotificationChannel implements NotificationChannel {
  async send(notification: Notification): Promise<void> {
    logger.info('SmsNotificationChannel (stub): would send SMS', {
      notificationId: notification.id,
      userId: notification.user_id,
      title: notification.title,
    });
    return Promise.resolve();
  }
}
