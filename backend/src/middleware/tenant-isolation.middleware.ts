import {Request, Response, NextFunction} from 'express';
import {ApiError} from '../utils/api-response';

/**
 * The single most important security control in this application.
 *
 * Must run AFTER `authenticate`. It unconditionally overwrites any
 * `society_id` / `societyId` present in the request body with the
 * authenticated user's own society id — a client-supplied value is never
 * trusted, silently ignored rather than rejected (rejecting would leak
 * information about the field's significance to a probing attacker, and
 * "ignore and use the authenticated context" is the documented behavior
 * this spec calls for).
 *
 * Every service method that reads/writes society-scoped rows additionally
 * takes `societyId` as an explicit parameter sourced from `req.currentUser`
 * — this middleware is defense in depth, not the only enforcement point.
 */
export function tenantIsolation(req: Request, _res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    return next(ApiError.unauthorized());
  }

  if (req.body && typeof req.body === 'object') {
    if ('society_id' in req.body) req.body.society_id = req.currentUser.societyId;
    if ('societyId' in req.body) req.body.societyId = req.currentUser.societyId;
  }

  next();
}
