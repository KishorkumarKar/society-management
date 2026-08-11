import * as Joi from 'joi';

export const createNotificationSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  type: Joi.string().trim().max(100).required(),
  title: Joi.string().trim().max(200).required(),
  body: Joi.string().trim().allow(null, '').optional(),
  channel: Joi.string().valid('in_app', 'email', 'sms', 'push').default('in_app'),
});

export const updateNotificationSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  body: Joi.string().trim().allow(null, '').optional(),
}).min(1);

export const listNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isRead: Joi.boolean().optional(),
  type: Joi.string().trim().max(100).optional(),
  // Only meaningful (and only honored) when the caller holds notifications.view_all.
  userId: Joi.number().integer().positive().optional(),
  sort: Joi.string().valid('created_at', '-created_at').default('-created_at'),
});
