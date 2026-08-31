import * as Joi from 'joi';

export const createEventExpenseSchema = Joi.object({
  eventId: Joi.number().integer().positive().required(),
  title: Joi.string().trim().max(200).required(),
  category: Joi.string().trim().max(100).required(),
  amount: Joi.number().min(0).required(),
  date: Joi.date().iso().required(),
  paidTo: Joi.string().trim().max(150).allow(null, '').optional(),
  notes: Joi.string().trim().allow(null, '').optional(),
});

export const updateEventExpenseSchema = Joi.object({
  title: Joi.string().trim().max(200).optional(),
  category: Joi.string().trim().max(100).optional(),
  amount: Joi.number().min(0).optional(),
  date: Joi.date().iso().optional(),
  paidTo: Joi.string().trim().max(150).allow(null, '').optional(),
  notes: Joi.string().trim().allow(null, '').optional(),
}).min(1);

export const listEventExpensesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  eventId: Joi.number().integer().positive().optional(),
  category: Joi.string().trim().max(100).optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  sort: Joi.string().valid('date', '-date', 'created_at', '-created_at').default('-date'),
});
