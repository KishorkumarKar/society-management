import {Router} from 'express';
import {PermissionsService} from './permissions.service';
import {listPermissionsQuerySchema, createPermissionSchema} from './permissions.validators';
import {validate} from '../../validators/validate.middleware';
import {authenticate} from '../../middleware/authenticate.middleware';
import {authorize} from '../../middleware/authorize.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok, paginated} from '../../utils/api-response';
import {parsePagination} from '../../utils/pagination';
import {PERMISSIONS} from '../acl/permissions.constants';

/**
 * @openapi
 * tags:
 *   - name: Permissions
 *     description: Global permission catalog (resource.action)
 */
export function buildPermissionsRouter(permissionsService: PermissionsService): Router {
  const router = Router();
  router.use(authenticate);

  
  /**
   * @openapi
   * /permissions:
   *   get:
   *     tags: [Permissions]
   *     summary: Permissions get
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Permissions get}
   *       403: {description: Permissions get}
   */
  router.get(
    '/',
    authorize(PERMISSIONS.PERMISSIONS_VIEW),
    validate(listPermissionsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {resource, search} = req.query as unknown as {resource?: string; search?: string};
      const {data, total} = await permissionsService.list(pagination, {resource, search});
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  // Creating new permissions is intentionally gated behind the same
  // roles.assign_permission-adjacent capability rather than a bespoke one —
  // in practice this is a rare, administrative action performed by whoever
  // can already shape roles. Reuses ROLES_CREATE as the closest existing
  // "I am allowed to extend the ACL surface" signal.
  
  /**
   * @openapi
   * /permissions:
   *   post:
   *     tags: [Permissions]
   *     summary: Permissions add
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Permissions add}
   *       403: {description: Permissions add}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.ROLES_CREATE),
    validate(createPermissionSchema),
    asyncHandler(async (req, res) => {
      const {resource, action, description} = req.body;
      const permission = await permissionsService.create(`${resource}.${action}`, resource, action, description);
      return ok(res, permission, 201);
    }),
  );

  return router;
}
