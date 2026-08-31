import * as Joi from 'joi';

export const createEventSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().allow(null, '').optional(),
  eventDate: Joi.date().iso().required(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
  targetAmount: Joi.number().min(0).default(0),
});

export const updateEventSchema = Joi.object({
  name: Joi.string().trim().max(200).optional(),
  description: Joi.string().trim().allow(null, '').optional(),
  eventDate: Joi.date().iso().optional(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
  targetAmount: Joi.number().min(0).optional(),
}).min(1);

export const listEventsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  sort: Joi.string().valid('event_date', '-event_date', 'created_at', '-created_at').default('-event_date'),
});
