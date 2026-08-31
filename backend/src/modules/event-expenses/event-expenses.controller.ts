import {Router} from 'express';
import {EventExpensesService} from './event-expenses.service';
import {
  createEventExpenseSchema,
  updateEventExpenseSchema,
  listEventExpensesQuerySchema,
} from './event-expenses.validators';
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
 *   - name: Event Expenses
 *     description: Spend tied to a specific event's budget (pass eventId), separate from society-wide /expenses
 */
export function buildEventExpensesRouter(eventExpensesService: EventExpensesService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  /**
   * @openapi
   * /event-expenses:
   *   post:
   *     tags: [Event Expenses]
   *     summary: Record an expense against an event's budget (eventId must belong to the caller's society)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       403: {description: eventId belongs to a different society}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.EVENT_EXPENSES_CREATE),
    validate(createEventExpenseSchema),
    asyncHandler(async (req, res) => {
      const expense = await eventExpensesService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, expense, 201);
    }),
  );

  /**
   * @openapi
   * /event-expenses:
   *   get:
   *     tags: [Event Expenses]
   *     summary: List event expenses (paginated, filterable by eventId/category/date range)
   *     security: [{bearerAuth: []}]
   */
  router.get(
    '/',
    authorize(PERMISSIONS.EVENT_EXPENSES_VIEW),
    validate(listEventExpensesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, eventId, category, fromDate, toDate, sort} = req.query as unknown as {
        search?: string;
        eventId?: number;
        category?: string;
        fromDate?: string;
        toDate?: string;
        sort: string;
      };
      const {data, total} = await eventExpensesService.list(req.currentUser!.societyId, pagination, {
        search,
        eventId,
        category,
        fromDate,
        toDate,
        sort,
      });
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.EVENT_EXPENSES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const expense = await eventExpensesService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, expense);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.EVENT_EXPENSES_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateEventExpenseSchema),
    asyncHandler(async (req, res) => {
      const expense = await eventExpensesService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, expense);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.EVENT_EXPENSES_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await eventExpensesService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  return router;
}
