import {Request, Response, NextFunction} from 'express';
import {verifyAccessToken} from '../modules/auth/jwt.util';
import {ApiError} from '../utils/api-response';

/**
 * Verifies the JWT access token and populates `req.currentUser`. This is
 * the ONLY place `societyId` and `userId` are established for the rest of
 * the request pipeline — every downstream handler must read from
 * `req.currentUser`, never from `req.body.society_id` or similar.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.currentUser = {
      userId: payload.sub,
      societyId: payload.societyId,
      roleIds: payload.roleIds ?? [],
    };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired access token', 'INVALID_TOKEN'));
  }
}
