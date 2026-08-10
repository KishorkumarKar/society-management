import * as Joi from 'joi';

export const createRoleSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().allow(null).optional(),
  isGlobal: Joi.boolean().default(false),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().allow(null).optional(),
}).min(1);

export const listRolesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  sort: Joi.string().valid('name', '-name', 'created_at', '-created_at').default('name'),
});

export const assignPermissionSchema = Joi.object({
  permissionId: Joi.number().integer().positive().required(),
});
