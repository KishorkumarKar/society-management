import {Router} from 'express';
import {ExpensesService} from './expenses.service';
import {createExpenseSchema, updateExpenseSchema, listExpensesQuerySchema, approveExpenseSchema} from './expenses.validators';
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
 *   - name: Expenses
 *     description: Society expense records with an approve/reject workflow
 */
export function buildExpensesRouter(expensesService: ExpensesService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  router.post(
    '/',
    authorize(PERMISSIONS.EXPENSES_CREATE),
    validate(createExpenseSchema),
    asyncHandler(async (req, res) => {
      const expense = await expensesService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, expense, 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.EXPENSES_VIEW),
    validate(listExpensesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, category, vendorName, fromDate, toDate, approvedBy, status, sort} = req.query as unknown as {
        search?: string;
        category?: string;
        vendorName?: string;
        fromDate?: string;
        toDate?: string;
        approvedBy?: number;
        status?: string;
        sort: string;
      };
      const {data, total} = await expensesService.list(req.currentUser!.societyId, pagination, {
        search,
        category,
        vendorName,
        fromDate,
        toDate,
        approvedBy,
        status,
        sort,
      });
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.EXPENSES_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const expense = await expensesService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, expense);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.EXPENSES_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateExpenseSchema),
    asyncHandler(async (req, res) => {
      const expense = await expensesService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, expense);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.EXPENSES_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await expensesService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  /**
   * @openapi
   * /expenses/{id}/approve:
   *   patch:
   *     tags: [Expenses]
   *     summary: Approve or reject a pending expense — approved_by/approved_at are always server-derived
   *     security: [{bearerAuth: []}]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [decision]
   *             properties:
   *               decision: {type: string, enum: [approved, rejected]}
   */
  router.patch(
    '/:id/approve',
    authorize(PERMISSIONS.EXPENSES_APPROVE),
    validate(idParamSchema, 'params'),
    validate(approveExpenseSchema),
    asyncHandler(async (req, res) => {
      const expense = await expensesService.approve(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.currentUser!.userId,
        req.body.decision,
      );
      return ok(res, expense);
    }),
  );

  return router;
}
