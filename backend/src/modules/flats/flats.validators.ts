import * as Joi from 'joi';

export const createFlatSchema = Joi.object({
  block: Joi.string().trim().max(50).required(),
  floor: Joi.string().trim().max(20).required(),
  unitNo: Joi.string().trim().max(20).required(),
  ownerId: Joi.number().integer().positive().allow(null).optional(),
  sqft: Joi.number().min(0).default(0),
  pricePerSqft: Joi.number().min(0).allow(null).optional(),
  fixPrice: Joi.number().min(0).allow(null).optional(),
});

export const updateFlatSchema = Joi.object({
  block: Joi.string().trim().max(50).optional(),
  floor: Joi.string().trim().max(20).optional(),
  unitNo: Joi.string().trim().max(20).optional(),
  ownerId: Joi.number().integer().positive().allow(null).optional(),
  sqft: Joi.number().min(0).optional(),
  pricePerSqft: Joi.number().min(0).allow(null).optional(),
  fixPrice: Joi.number().min(0).allow(null).optional(),
}).min(1);

export const listFlatsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  block: Joi.string().trim().max(50).optional(),
  sort: Joi.string().valid('unit_no', '-unit_no', 'created_at', '-created_at').default('-created_at'),
});
