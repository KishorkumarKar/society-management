import {Request, Response, NextFunction} from 'express';
import {AclService} from '../modules/acl/acl.service';
import {ApiError} from '../utils/api-response';

/**
 * `authorize('users.create')` — must run AFTER `authenticate`. Looks up the
 * caller's permission set (via AclService, which is DB/cache-backed, never
 * JWT-claim-backed) and returns 403 if the required permission is absent.
 *
 * Usage:
 *   router.post('/users', authenticate, authorize(PERMISSIONS.USERS_CREATE), handler)
 */
export function authorize(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.currentUser) {
      return next(ApiError.unauthorized());
    }

    const aclService: AclService = req.app.locals.aclService;
    const hasAll = await Promise.all(
      requiredPermissions.map((p) => aclService.hasPermission(req.currentUser!.userId, req.currentUser!.societyId, p)),
    );

    if (hasAll.some((allowed) => !allowed)) {
      return next(ApiError.forbidden());
    }

    next();
  };
}

/** Passes if the caller holds ANY of the listed permissions. */
export function authorizeAny(...anyOfPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.currentUser) {
      return next(ApiError.unauthorized());
    }
    const aclService: AclService = req.app.locals.aclService;
    const allowed = await aclService.hasAnyPermission(req.currentUser.userId, req.currentUser.societyId, anyOfPermissions);
    if (!allowed) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
