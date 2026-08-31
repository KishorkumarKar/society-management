import * as Joi from 'joi';

export const createEventCollectionSchema = Joi.object({
  eventId: Joi.number().integer().positive().required(),
  memberName: Joi.string().trim().max(150).required(),
  unit: Joi.string().trim().max(50).required(),
  amountDue: Joi.number().min(0).required(),
  amountPaid: Joi.number().min(0).default(0),
  paymentDate: Joi.date().iso().allow(null).optional(),
  // If omitted, the service derives it from amountPaid vs amountDue.
  status: Joi.string().valid('pending', 'partial', 'paid').optional(),
  notes: Joi.string().trim().allow(null, '').optional(),
});

export const updateEventCollectionSchema = Joi.object({
  memberName: Joi.string().trim().max(150).optional(),
  unit: Joi.string().trim().max(50).optional(),
  amountDue: Joi.number().min(0).optional(),
  amountPaid: Joi.number().min(0).optional(),
  paymentDate: Joi.date().iso().allow(null).optional(),
  status: Joi.string().valid('pending', 'partial', 'paid').optional(),
  notes: Joi.string().trim().allow(null, '').optional(),
}).min(1);

export const listEventCollectionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  eventId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pending', 'partial', 'paid').optional(),
  unit: Joi.string().trim().max(50).optional(),
  sort: Joi.string().valid('created_at', '-created_at', 'payment_date', '-payment_date').default('-created_at'),
});
