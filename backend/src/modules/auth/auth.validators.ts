import * as Joi from 'joi';

export const loginSchema = Joi.object({
  society: Joi.string().trim().lowercase().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s]{7,20}$/)
    .optional(),
  password: Joi.string().min(1).required(),
})
  .or('email', 'phone')
  .messages({'object.missing': 'Either email or phone is required'});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
