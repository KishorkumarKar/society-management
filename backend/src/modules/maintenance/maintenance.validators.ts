import * as Joi from 'joi';

export const createBillSchema = Joi.object({
  flatId: Joi.number().integer().positive().required(),
  billingYear: Joi.number().integer().min(2000).max(2100).required(),
  billingMonth: Joi.number().integer().min(1).max(12).required(),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().iso().required(),
  penalty: Joi.number().min(0).default(0),
});

export const updateBillSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  dueDate: Joi.date().iso().optional(),
  status: Joi.string().valid('due', 'paid', 'overdue', 'approved').optional(),
  penalty: Joi.number().min(0).optional(),
}).min(1);

export const listBillsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  flatId: Joi.number().integer().positive().optional(),
  billingYear: Joi.number().integer().optional(),
  billingMonth: Joi.number().integer().min(1).max(12).optional(),
  status: Joi.string().valid('due', 'paid', 'overdue', 'approved').optional(),
  sort: Joi.string()
    .valid('due_date', '-due_date', 'created_at', '-created_at')
    .default('-due_date'),
});

export const createPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  paymentDate: Joi.date().iso().required(),
  paymentMethod: Joi.string().valid('cash', 'cheque', 'upi', 'bank_transfer', 'card', 'other').required(),
  transactionId: Joi.string().trim().max(150).allow(null).optional(),
});
