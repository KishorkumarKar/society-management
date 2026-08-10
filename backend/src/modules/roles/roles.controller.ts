import {Router} from 'express';
import {RolesService} from './roles.service';
import {createRoleSchema, updateRoleSchema, listRolesQuerySchema, assignPermissionSchema} from './roles.validators';
import {idParamSchema} from '../societies/societies.validators';
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
 *   - name: Roles
 *     description: RBAC roles — society-scoped, plus visibility into global/system roles
 */
export function buildRolesRouter(rolesService: RolesService): Router {
  const router = Router();
  router.use(authenticate);

  router.post(
    '/',
    authorize(PERMISSIONS.ROLES_CREATE),
    validate(createRoleSchema),
    asyncHandler(async (req, res) => {
      const role = await rolesService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, role, 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.ROLES_VIEW),
    validate(listRolesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, sort} = req.query as unknown as {search?: string; sort: string};
      const {data, total} = await rolesService.list(req.currentUser!.societyId, pagination, {search, sort});
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.ROLES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const role = await rolesService.findVisible(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, role);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.ROLES_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateRoleSchema),
    asyncHandler(async (req, res) => {
      const role = await rolesService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, role);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.ROLES_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await rolesService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  router.get(
    '/:id/permissions',
    authorize(PERMISSIONS.ROLES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const permissions = await rolesService.listPermissions(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, permissions);
    }),
  );

  router.post(
    '/:id/permissions',
    authorize(PERMISSIONS.ROLES_ASSIGN_PERMISSION),
    validate(idParamSchema, 'params'),
    validate(assignPermissionSchema),
    asyncHandler(async (req, res) => {
      await rolesService.assignPermission(req.currentUser!.societyId, Number(req.params.id), req.body.permissionId);
      return ok(res, {assigned: true});
    }),
  );

  router.delete(
    '/:id/permissions/:permissionId',
    authorize(PERMISSIONS.ROLES_ASSIGN_PERMISSION),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await rolesService.removePermission(req.currentUser!.societyId, Number(req.params.id), Number(req.params.permissionId));
      return ok(res, {removed: true});
    }),
  );

  return router;
}
