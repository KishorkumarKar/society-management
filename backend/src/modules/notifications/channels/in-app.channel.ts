import {NotificationChannel} from './notification-channel.interface';
import {Notification} from '../../../domain/entities/notification.entity';

/**
 * The "in_app" channel's delivery IS the database row itself — by the time
 * NotificationService hands a saved Notification to this channel, it's
 * already visible to the user via GET /notifications. This provider exists
 * mainly to keep the abstraction uniform (every channel gets `send()`
 * called) and as the place to add e.g. a websocket/SSE push later without
 * touching NotificationService.
 */
export class InAppNotificationChannel implements NotificationChannel {
  async send(_notification: Notification): Promise<void> {
    // No-op: persistence already happened in NotificationService.create().
    return Promise.resolve();
  }
}
