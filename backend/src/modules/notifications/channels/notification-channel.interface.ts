import {Notification} from '../../../domain/entities/notification.entity';

/**
 * Abstraction every delivery mechanism implements. NotificationService
 * depends only on this interface, never on a concrete provider — so
 * swapping the email stub for real SMTP, or SMS for Twilio, or push for
 * FCM, touches only that one provider file.
 */
export interface NotificationChannel {
  send(notification: Notification): Promise<void>;
}
