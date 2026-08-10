import * as Joi from 'joi';

export const createSocietySchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  city: Joi.string().trim().max(100).required(),
  address: Joi.string().trim().required(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .max(100)
    .required(),
  userLimit: Joi.number().integer().min(0).default(0),
  registrationNo: Joi.string().trim().max(100).allow(null).optional(),
  rateType: Joi.string().valid('PER_SQFT', 'FIXED').default('PER_SQFT'),
  ratePerSqft: Joi.number().min(0).default(0),
});

export const updateSocietySchema = Joi.object({
  name: Joi.string().trim().max(150).optional(),
  city: Joi.string().trim().max(100).optional(),
  address: Joi.string().trim().optional(),
  userLimit: Joi.number().integer().min(0).optional(),
  registrationNo: Joi.string().trim().max(100).allow(null).optional(),
  status: Joi.number().valid(0, 1).optional(),
  rateType: Joi.string().valid('PER_SQFT', 'FIXED').optional(),
  ratePerSqft: Joi.number().min(0).optional(),
}).min(1);

export const listSocietiesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  status: Joi.number().valid(0, 1).optional(),
  sort: Joi.string().valid('name', '-name', 'created_at', '-created_at').default('-created_at'),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
