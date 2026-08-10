import * as Joi from 'joi';

export const listPermissionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  resource: Joi.string().trim().max(100).optional(),
  search: Joi.string().trim().max(150).optional(),
});

export const createPermissionSchema = Joi.object({
  resource: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z_]+$/)
    .required(),
  action: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z_]+$/)
    .required(),
  description: Joi.string().trim().allow(null).optional(),
});
