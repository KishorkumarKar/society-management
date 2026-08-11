import * as Joi from 'joi';

export const createExpenseSchema = Joi.object({
  category: Joi.string().trim().max(100).required(),
  vendorName: Joi.string().trim().max(150).allow(null, '').optional(),
  amount: Joi.number().positive().required(),
  expenseDate: Joi.date().iso().required(),
  receiptUrl: Joi.string().uri().max(500).allow(null, '').optional(),
  description: Joi.string().trim().allow(null, '').optional(),
});

export const updateExpenseSchema = Joi.object({
  category: Joi.string().trim().max(100).optional(),
  vendorName: Joi.string().trim().max(150).allow(null, '').optional(),
  amount: Joi.number().positive().optional(),
  expenseDate: Joi.date().iso().optional(),
  receiptUrl: Joi.string().uri().max(500).allow(null, '').optional(),
  description: Joi.string().trim().allow(null, '').optional(),
}).min(1);

export const listExpensesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(150).optional(),
  category: Joi.string().trim().max(100).optional(),
  vendorName: Joi.string().trim().max(150).optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  approvedBy: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  sort: Joi.string().valid('expense_date', '-expense_date', 'created_at', '-created_at', 'amount', '-amount').default('-expense_date'),
});

export const approveExpenseSchema = Joi.object({
  decision: Joi.string().valid('approved', 'rejected').required(),
});
