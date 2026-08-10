import {Request, Response, NextFunction} from 'express';
import {ObjectSchema} from 'joi';
import {ApiError} from '../utils/api-response';

type Target = 'body' | 'query' | 'params';

/**
 * Validates `req[target]` against a Joi schema. On success, replaces
 * `req[target]` with the validated+coerced value (so e.g. numeric query
 * strings become real numbers downstream). On failure, throws a single
 * consistently-shaped 422 with every violation listed.
 */
export function validate(schema: ObjectSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const {error, value} = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(ApiError.validation('Validation failed', details));
    }

    req[target] = value;
    next();
  };
}
