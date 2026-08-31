import {Router} from 'express';
import {EventsService} from './events.service';
import {createEventSchema, updateEventSchema, listEventsQuerySchema} from './events.validators';
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
 *   - name: Events
 *     description: Society-organized events, scoped to the caller's society. Per-event collections and expenses live under /event-collections and /event-expenses (each takes eventId).
 */
export function buildEventsRouter(eventsService: EventsService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  /**
   * @openapi
   * /events:
   *   post:
   *     tags: [Events]
   *     summary: Create an event (createdBy is always the authenticated actor)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.EVENTS_CREATE),
    validate(createEventSchema),
    asyncHandler(async (req, res) => {
      const event = await eventsService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, event, 201);
    }),
  );

  /**
   * @openapi
   * /events:
   *   get:
   *     tags: [Events]
   *     summary: List events (paginated, filterable by status/date range)
   *     security: [{bearerAuth: []}]
   */
  router.get(
    '/',
    authorize(PERMISSIONS.EVENTS_VIEW),
    validate(listEventsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, status, fromDate, toDate, sort} = req.query as unknown as {
        search?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        sort: string;
      };
      const {data, total} = await eventsService.list(req.currentUser!.societyId, pagination, {
        search,
        status,
        fromDate,
        toDate,
        sort,
      });
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.EVENTS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const event = await eventsService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, event);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.EVENTS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateEventSchema),
    asyncHandler(async (req, res) => {
      const event = await eventsService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, event);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.EVENTS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await eventsService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  return router;
}
