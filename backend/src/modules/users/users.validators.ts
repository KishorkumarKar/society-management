import * as Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s]{7,20}$/)
    .optional(),
  password: Joi.string().min(8).max(72).required(),
  flatId: Joi.number().integer().positive().allow(null).optional(),
  roleIds: Joi.array().items(Joi.number().integer().positive()).optional().default([]),
})
  .or('email', 'phone')
  .messages({'object.missing': 'Either email or phone is required'});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().max(150).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s]{7,20}$/)
    .optional(),
  flatId: Joi.number().integer().positive().allow(null).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  is_active: Joi.boolean().optional(),
  sort: Joi.string().valid('name', '-name', 'created_at', '-created_at').default('-created_at'),
});

export const assignRoleSchema = Joi.object({
  roleId: Joi.number().integer().positive().required(),
});
