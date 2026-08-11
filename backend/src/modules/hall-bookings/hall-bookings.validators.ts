import * as Joi from 'joi';

export const createHallBookingSchema = Joi.object({
  flatId: Joi.number().integer().positive().required(),
  hallName: Joi.string().trim().max(100).required(),
  bookingDate: Joi.date().iso().required(),
  timeSlot: Joi.string().trim().max(50).required(),
  purpose: Joi.string().trim().max(255).allow(null, '').optional(),
  amount: Joi.number().min(0).default(0),
  deposit: Joi.number().min(0).default(0),
});

export const updateHallBookingSchema = Joi.object({
  hallName: Joi.string().trim().max(100).optional(),
  bookingDate: Joi.date().iso().optional(),
  timeSlot: Joi.string().trim().max(50).optional(),
  purpose: Joi.string().trim().max(255).allow(null, '').optional(),
  amount: Joi.number().min(0).optional(),
  deposit: Joi.number().min(0).optional(),
}).min(1);

export const listHallBookingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  bookingDate: Joi.date().iso().optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional(),
  hallName: Joi.string().trim().max(100).optional(),
  flatId: Joi.number().integer().positive().optional(),
  sort: Joi.string()
    .valid('booking_date', '-booking_date', 'created_at', '-created_at')
    .default('-booking_date'),
});
