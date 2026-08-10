import {Router} from 'express';
import {UsersService} from './users.service';
import {createUserSchema, updateUserSchema, listUsersQuerySchema, assignRoleSchema} from './users.validators';
import {idParamSchema} from '../societies/societies.validators';
import {validate} from '../../validators/validate.middleware';
import {authenticate} from '../../middleware/authenticate.middleware';
import {authorize} from '../../middleware/authorize.middleware';
import {tenantIsolation} from '../../middleware/tenant-isolation.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok, paginated} from '../../utils/api-response';
import {parsePagination} from '../../utils/pagination';
import {PERMISSIONS} from '../acl/permissions.constants';

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Society members — every endpoint is scoped to the caller's own society
 */
export function buildUsersRouter(usersService: UsersService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  router.post(
    '/',
    authorize(PERMISSIONS.USERS_CREATE),
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
      const user = await usersService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, user.toSafeJSON(), 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.USERS_VIEW),
    validate(listUsersQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, is_active, sort} = req.query as unknown as {
        search?: string;
        is_active?: boolean;
        sort: string;
      };
      const {data, total} = await usersService.list(req.currentUser!.societyId, pagination, {
        search,
        isActive: is_active,
        sort,
      });
      return paginated(
        res,
        data.map((u) => u.toSafeJSON()),
        {page: pagination.page, limit: pagination.limit, total},
      );
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.USERS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const user = await usersService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, user.toSafeJSON());
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.USERS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateUserSchema),
    asyncHandler(async (req, res) => {
      const user = await usersService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, user.toSafeJSON());
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.USERS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await usersService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  router.get(
    '/:id/permissions',
    authorize(PERMISSIONS.USERS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const permissions = await usersService.getUserPermissions(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {permissions});
    }),
  );

  router.post(
    '/:id/roles',
    authorize(PERMISSIONS.USERS_ASSIGN_ROLE),
    validate(idParamSchema, 'params'),
    validate(assignRoleSchema),
    asyncHandler(async (req, res) => {
      await usersService.assignRole(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.body.roleId,
        req.currentUser!.userId,
      );
      return ok(res, {assigned: true});
    }),
  );

  router.delete(
    '/:id/roles/:roleId',
    authorize(PERMISSIONS.USERS_ASSIGN_ROLE),
    asyncHandler(async (req, res) => {
      await usersService.removeRole(
        req.currentUser!.societyId,
        Number(req.params.id),
        Number(req.params.roleId),
        req.currentUser!.userId,
      );
      return ok(res, {removed: true});
    }),
  );

  return router;
}
