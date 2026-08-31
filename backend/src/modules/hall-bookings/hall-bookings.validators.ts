import * as Joi from 'joi';

export const createHallBookingSchema = Joi.object({
  flatId: Joi.number().integer().positive().required(),
  hallName: Joi.string().trim().max(100).required(),
  startDateTime: Joi.date().iso().required(),
  // .greater(Joi.ref('startDateTime')) enforces end > start at the
  // validation layer; the service re-checks this defensively too since
  // update() re-derives the effective range from partial input.
  endDateTime: Joi.date().iso().greater(Joi.ref('startDateTime')).required().messages({
    'date.greater': 'endDateTime must be after startDateTime',
  }),
  purpose: Joi.string().trim().max(255).allow(null, '').optional(),
  amount: Joi.number().min(0).default(0),
  deposit: Joi.number().min(0).default(0),
});

export const updateHallBookingSchema = Joi.object({
  hallName: Joi.string().trim().max(100).optional(),
  startDateTime: Joi.date().iso().optional(),
  // When both are provided together end must be after start; when only one
  // is provided the service compares it against the existing stored value.
  endDateTime: Joi.date()
    .iso()
    .optional()
    .when('startDateTime', {
      is: Joi.exist(),
      then: Joi.date().iso().greater(Joi.ref('startDateTime')).messages({
        'date.greater': 'endDateTime must be after startDateTime',
      }),
    }),
  purpose: Joi.string().trim().max(255).allow(null, '').optional(),
  amount: Joi.number().min(0).optional(),
  deposit: Joi.number().min(0).optional(),
}).min(1);

export const listHallBookingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional(),
  hallName: Joi.string().trim().max(100).optional(),
  flatId: Joi.number().integer().positive().optional(),
  sort: Joi.string()
    .valid('start_datetime', '-start_datetime', 'created_at', '-created_at')
    .default('-start_datetime'),
});
