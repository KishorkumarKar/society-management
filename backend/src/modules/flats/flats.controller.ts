import {Router} from 'express';
import {FlatsService} from './flats.service';
import {createFlatSchema, updateFlatSchema, listFlatsQuerySchema} from './flats.validators';
import {idParamSchema} from '../societies/societies.validators';
import {validate} from '../../validators/validate.middleware';
import {authenticate} from '../../middleware/authenticate.middleware';
import {authorize} from '../../middleware/authorize.middleware';
import {tenantIsolation} from '../../middleware/tenant-isolation.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok, paginated} from '../../utils/api-response';
import {parsePagination} from '../../utils/pagination';
import {PERMISSIONS} from '../acl/permissions.constants';

export function buildFlatsRouter(flatsService: FlatsService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  router.post(
    '/',
    authorize(PERMISSIONS.FLATS_CREATE),
    validate(createFlatSchema),
    asyncHandler(async (req, res) => {
      const flat = await flatsService.create(req.currentUser!.societyId, req.body);
      return ok(res, flat, 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.FLATS_VIEW),
    validate(listFlatsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, block, sort} = req.query as unknown as {search?: string; block?: string; sort: string};
      const {data, total} = await flatsService.list(req.currentUser!.societyId, pagination, {search, block, sort});
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.FLATS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const flat = await flatsService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, flat);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.FLATS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateFlatSchema),
    asyncHandler(async (req, res) => {
      const flat = await flatsService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, flat);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.FLATS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await flatsService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  return router;
}
