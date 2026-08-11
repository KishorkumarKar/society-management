import * as Joi from 'joi';

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  body: Joi.string().trim().required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  // Empty/omitted => society-wide. Otherwise, an explicit list of role ids
  // (validated against the caller's own society + global roles in the service).
  targetRoleIds: Joi.array().items(Joi.number().integer().positive()).optional().default([]),
});

export const updateAnnouncementSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  body: Joi.string().trim().optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  targetRoleIds: Joi.array().items(Joi.number().integer().positive()).optional(),
}).min(1);

export const listAnnouncementsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  targetRole: Joi.number().integer().positive().optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  sort: Joi.string().valid('created_at', '-created_at', 'priority', '-priority').default('-created_at'),
});
