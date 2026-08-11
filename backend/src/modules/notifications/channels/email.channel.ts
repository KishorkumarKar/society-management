import {NotificationChannel} from './notification-channel.interface';
import {Notification} from '../../../domain/entities/notification.entity';
import {logger} from '../../../infrastructure/logging/logger';

/**
 * Stub/log-only implementation for development and testing. Swap the body
 * of `send()` for a real SMTP (nodemailer) call when an email provider is
 * chosen — NotificationService and every caller of it are unaffected.
 */
export class EmailNotificationChannel implements NotificationChannel {
  async send(notification: Notification): Promise<void> {
    logger.info('EmailNotificationChannel (stub): would send email', {
      notificationId: notification.id,
      userId: notification.user_id,
      title: notification.title,
    });
    return Promise.resolve();
  }
}
