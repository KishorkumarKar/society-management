import {Router} from 'express';
import {SocietiesService} from './societies.service';
import {createSocietySchema, updateSocietySchema, listSocietiesQuerySchema, idParamSchema} from './societies.validators';
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
 *   - name: Societies
 *     description: Tenant root — managed by global (Super Admin) permissions only
 */
export function buildSocietiesRouter(societiesService: SocietiesService): Router {
  const router = Router();
  router.use(authenticate);

  /**
   * @openapi
   * /societies:
   *   post:
   *     tags: [Societies]
   *     summary: Create a society
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing societies.create permission}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.SOCIETIES_CREATE),
    validate(createSocietySchema),
    asyncHandler(async (req, res) => {
      const society = await societiesService.create(req.body);
      return ok(res, society, 201);
    }),
  );

  /**
   * @openapi
   * /societies:
   *   get:
   *     tags: [Societies]
   *     summary: List societies (paginated, searchable)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing societies.create permission}
   */
  router.get(
    '/',
    authorize(PERMISSIONS.SOCIETIES_VIEW),
    validate(listSocietiesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, status, sort} = req.query as unknown as {search?: string; status?: 0 | 1; sort: string};
      const {data, total} = await societiesService.list(pagination, {search, status, sort});
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  /**
   * @openapi
   * /societies/{id}:
   *   get:
   *     tags: [Societies]
   *     summary: Get a society by id
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: Missing societies.create permission}
   */
  router.get(
    '/:id',
    authorize(PERMISSIONS.SOCIETIES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const society = await societiesService.findById(Number(req.params.id));
      return ok(res, society);
    }),
  );

  /**
   * @openapi
   * /societies/{id}:
   *   patch:
   *     tags: [Societies]
   *     summary: Update a society
   *     security: [{bearerAuth: []}]
   */
  router.patch(
    '/:id',
    authorize(PERMISSIONS.SOCIETIES_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateSocietySchema),
    asyncHandler(async (req, res) => {
      const society = await societiesService.update(Number(req.params.id), req.body);
      return ok(res, society);
    }),
  );

  /**
   * @openapi
   * /societies/{id}:
   *   delete:
   *     tags: [Societies]
   *     summary: Soft-delete a society
   *     security: [{bearerAuth: []}]
   */
  router.delete(
    '/:id',
    authorize(PERMISSIONS.SOCIETIES_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await societiesService.softDelete(Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  return router;
}
