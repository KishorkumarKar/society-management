import {Router} from 'express';
import {MaintenanceService} from './maintenance.service';
import {createBillSchema, updateBillSchema, listBillsQuerySchema, createPaymentSchema} from './maintenance.validators';
import {idParamSchema} from '../societies/societies.validators';
import {validate} from '../../validators/validate.middleware';
import {authenticate} from '../../middleware/authenticate.middleware';
import {authorize} from '../../middleware/authorize.middleware';
import {tenantIsolation} from '../../middleware/tenant-isolation.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok, paginated} from '../../utils/api-response';
import {parsePagination} from '../../utils/pagination';
import {PERMISSIONS} from '../acl/permissions.constants';

function serializeBillWithOutstanding(item: {bill: unknown; totalPaid: number; outstanding: number}) {
  return {...(item.bill as Record<string, unknown>), totalPaid: item.totalPaid, outstanding: item.outstanding};
}

export function buildMaintenanceRouter(maintenanceService: MaintenanceService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  router.post(
    '/',
    authorize(PERMISSIONS.MAINTENANCE_CREATE),
    validate(createBillSchema),
    asyncHandler(async (req, res) => {
      const bill = await maintenanceService.createBill(req.currentUser!.societyId, req.body);
      return ok(res, bill, 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.MAINTENANCE_VIEW),
    validate(listBillsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {flatId, billingYear, billingMonth, status, sort} = req.query as unknown as {
        flatId?: number;
        billingYear?: number;
        billingMonth?: number;
        status?: string;
        sort: string;
      };
      const {data, total} = await maintenanceService.list(req.currentUser!.societyId, pagination, {
        flatId,
        billingYear,
        billingMonth,
        status,
        sort,
      });
      return paginated(res, data.map(serializeBillWithOutstanding), {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.MAINTENANCE_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const result = await maintenanceService.getWithOutstanding(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, serializeBillWithOutstanding(result));
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.MAINTENANCE_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateBillSchema),
    asyncHandler(async (req, res) => {
      const bill = await maintenanceService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, bill);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.MAINTENANCE_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await maintenanceService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  // --- Payments (nested under a bill) ---

  router.post(
    '/:id/payments',
    authorize(PERMISSIONS.MAINTENANCE_COLLECT),
    validate(idParamSchema, 'params'),
    validate(createPaymentSchema),
    asyncHandler(async (req, res) => {
      const payment = await maintenanceService.recordPayment(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.body,
      );
      return ok(res, payment, 201);
    }),
  );

  router.get(
    '/:id/payments',
    authorize(PERMISSIONS.MAINTENANCE_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const payments = await maintenanceService.listPayments(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, payments);
    }),
  );

  return router;
}
