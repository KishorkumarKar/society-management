import {Router} from 'express';
import {EventCollectionsService} from './event-collections.service';
import {
  createEventCollectionSchema,
  updateEventCollectionSchema,
  listEventCollectionsQuerySchema,
} from './event-collections.validators';
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
 *   - name: Event Collections
 *     description: Per-member contributions toward a specific event's target_amount (pass eventId to scope/filter)
 */
export function buildEventCollectionsRouter(eventCollectionsService: EventCollectionsService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  /**
   * @openapi
   * /event-collections:
   *   post:
   *     tags: [Event Collections]
   *     summary: Record a member's contribution toward an event (eventId must belong to the caller's society)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: eventId belongs to a different society}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.EVENT_COLLECTIONS_CREATE),
    validate(createEventCollectionSchema),
    asyncHandler(async (req, res) => {
      const collection = await eventCollectionsService.create(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        req.body,
      );
      return ok(res, collection, 201);
    }),
  );

  /**
   * @openapi
   * /event-collections:
   *   get:
   *     tags: [Event Collections]
   *     summary: List event collections (paginated, filterable by eventId/status/unit)
   *     security: [{bearerAuth: []}]
   */
  router.get(
    '/',
    authorize(PERMISSIONS.EVENT_COLLECTIONS_VIEW),
    validate(listEventCollectionsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, eventId, status, unit, sort} = req.query as unknown as {
        search?: string;
        eventId?: number;
        status?: string;
        unit?: string;
        sort: string;
      };
      const {data, total} = await eventCollectionsService.list(req.currentUser!.societyId, pagination, {
        search,
        eventId,
        status,
        unit,
        sort,
      });
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.EVENT_COLLECTIONS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const collection = await eventCollectionsService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, collection);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.EVENT_COLLECTIONS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateEventCollectionSchema),
    asyncHandler(async (req, res) => {
      const collection = await eventCollectionsService.update(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.body,
      );
      return ok(res, collection);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.EVENT_COLLECTIONS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await eventCollectionsService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  return router;
}
