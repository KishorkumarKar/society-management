import {Router} from 'express';
import {RolesService} from './roles.service';
import {createRoleSchema, updateRoleSchema, listRolesQuerySchema, assignPermissionSchema} from './roles.validators';
import {idParamSchema, rolePermissionParamSchema} from '../societies/societies.validators';
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

  
  /**
   * @openapi
   * /roles:
   *   post:
   *     tags: [Roles]
   *     summary: Roles add
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: roles add}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.ROLES_CREATE),
    validate(createRoleSchema),
    asyncHandler(async (req, res) => {
      const role = await rolesService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, role, 201);
    }),
  );

  
  /**
   * @openapi
   * /roles:
   *   get:
   *     tags: [Roles]
   *     summary: Roles List
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Roles List}
   */
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

  
  /**
   * @openapi
   * /roles/{id}:
   *   get:
   *     tags: [Roles]
   *     summary: Get roles
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Get roles}
   */
  router.get(
    '/:id',
    authorize(PERMISSIONS.ROLES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const role = await rolesService.findVisible(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, role);
    }),
  );

  
  /**
   * @openapi
   * /roles/{id}:
   *   patch:
   *     tags: [Roles]
   *     summary: Roles Update
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Roles Update}
   *       403: {description: Roles Update}
   */
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

  
  /**
   * @openapi
   * /roles/{id}:
   *   delete:
   *     tags: [Roles]
   *     summary: Roles Delete
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Roles Delete}
   *       403: {description: Roles Delete}
   */
  router.delete(
    '/:id',
    authorize(PERMISSIONS.ROLES_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await rolesService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  
  /**
   * @openapi
   * /roles/{id}/permissions:
   *   get:
   *     tags: [Roles]
   *     summary: Roles permissions get
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Roles permissions get}
   *       403: {description: Roles permissions get}
   */
  router.get(
    '/:id/permissions',
    authorize(PERMISSIONS.ROLES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const permissions = await rolesService.listPermissions(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, permissions);
    }),
  );

  
  /**
   * @openapi
   * /roles/{id}/permissions:
   *   post:
   *     tags: [Roles]
   *     summary: Roles permissions add
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Roles permissions add}
   *       403: {description: Roles permissions add}
   */
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

  /**
   * @openapi
   * /roles/{id}/permissions/{permissionId}:
   *   delete:
   *     tags: [Roles]
   *     summary: Roles permissions delete
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Roles permissions delete}
   *       403: {description: Roles permissions delete}
   */
  router.delete(
    '/:id/permissions/:permissionId',
    authorize(PERMISSIONS.ROLES_ASSIGN_PERMISSION),
    validate(rolePermissionParamSchema, 'params'),
    asyncHandler(async (req, res) => {
    console.log("------",req.params)
      await rolesService.removePermission(req.currentUser!.societyId, Number(req.params.id), Number(req.params.permissionId));
      return ok(res, {removed: true});
    }),
  );

  return router;
}
