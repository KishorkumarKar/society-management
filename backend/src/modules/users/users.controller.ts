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

  
  /**
   * @openapi
   * /users:
   *   post:
   *     tags: [Users]
   *     summary: Create User
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Create User}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.USERS_CREATE),
    (req, res, next) => {
      const schema = createUserSchema(req.currentUser!.isSupperAdmin === true);
      validate(schema)(req, res, next);
    },
    asyncHandler(async (req, res) => {
      const user = await usersService.create(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        req.body,
        req.currentUser!.isSupperAdmin,
      );
      return ok(res, user.toSafeJSON(), 201);
    }),
  );

  /**
   * @openapi
   * /users:
   *   get:
   *     tags: [Users]
   *     summary: List user (paginated, searchable)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing user.get permission}
   */
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

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Get a user by id
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing user.get permission}
   */
  router.get(
    '/:id',
    authorize(PERMISSIONS.USERS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const user = await usersService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, user.toSafeJSON());
    }),
  );

  
  /**
   * @openapi
   * /users/{id}:
   *   patch:
   *     tags: [Users]
   *     summary: Update a user
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing user.create permission}
   */
  router.patch(
    '/:id',
    authorize(PERMISSIONS.USERS_UPDATE),
    validate(idParamSchema, 'params'),
    
    (req, res, next) => {
      const schema = updateUserSchema(req.currentUser!.isSupperAdmin === true);
      validate(schema)(req, res, next);
    },
    asyncHandler(async (req, res) => {
      const user = await usersService.update(req.currentUser!.societyId, Number(req.params.id), req.body, req.currentUser!.isSupperAdmin);
      return ok(res, user.toSafeJSON());
    }),
  );

  
  /**
   * @openapi
   * /users/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Delete a user
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing user.delete permission}
   */
  router.delete(
    '/:id',
    authorize(PERMISSIONS.USERS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await usersService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  
  /**
   * @openapi
   * /users/{id}/permissions:
   *   get:
   *     tags: [Users]
   *     summary: User permissions
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Get user permissions}
   */
  router.get(
    '/:id/permissions',
    authorize(PERMISSIONS.USERS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const permissions = await usersService.getUserPermissions(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {permissions});
    }),
  );

  
  /**
   * @openapi
   * /users/{id}/roles:
   *   post:
   *     tags: [Users]
   *     summary: User roles add
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Get user roles add}
   */
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

  
  /**
   * @openapi
   * /users/{id}/roles/{roleId}:
   *   delete:
   *     tags: [Users]
   *     summary: Delete user roles
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Delete user roles}
   */
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
