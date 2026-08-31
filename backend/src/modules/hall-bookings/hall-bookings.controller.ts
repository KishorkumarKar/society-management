import {Router} from 'express';
import {HallBookingsService} from './hall-bookings.service';
import {createHallBookingSchema, updateHallBookingSchema, listHallBookingsQuerySchema} from './hall-bookings.validators';
import {idParamSchema} from '../societies/societies.validators';
import {validate} from '../../validators/validate.middleware';
import {authenticate} from '../../middleware/authenticate.middleware';
import {authorize} from '../../middleware/authorize.middleware';
import {tenantIsolation} from '../../middleware/tenant-isolation.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok, paginated} from '../../utils/api-response';
import {parsePagination} from '../../utils/pagination';
import {PERMISSIONS} from '../acl/permissions.constants';
import {HallBookingStatus} from '../../domain/entities/hall-booking.entity';

/**
 * @openapi
 * tags:
 *   - name: Hall Bookings
 *     description: Common-hall booking requests, scoped to the caller's society
 */
export function buildHallBookingsRouter(hallBookingsService: HallBookingsService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  /**
   * @openapi
   * /hall-bookings:
   *   post:
   *     tags: [Hall Bookings]
   *     summary: Create a hall booking request with a start/end datetime range (status starts as pending)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       201: {description: Created}
   *       409: {description: Hall already booked for an overlapping date/time range}
   */
  router.post(
    '/',
    authorize(PERMISSIONS.HALL_BOOKINGS_CREATE),
    validate(createHallBookingSchema),
    asyncHandler(async (req, res) => {
      const booking = await hallBookingsService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, booking, 201);
    }),
  );

  /**
   * @openapi
   * /hall-bookings:
   *   get:
   *     tags: [Hall Bookings]
   *     summary: List hall bookings (paginated, filterable by start_datetime range/status/hall/flat)
   *     security: [{bearerAuth: []}]
   */
  router.get(
    '/',
    authorize(PERMISSIONS.HALL_BOOKINGS_VIEW),
    validate(listHallBookingsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, fromDate, toDate, status, hallName, flatId, sort} = req.query as unknown as {
        search?: string;
        fromDate?: string;
        toDate?: string;
        status?: string;
        hallName?: string;
        flatId?: number;
        sort: string;
      };
      const {data, total} = await hallBookingsService.list(req.currentUser!.societyId, pagination, {
        search,
        fromDate,
        toDate,
        status,
        hallName,
        flatId,
        sort,
      });
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.HALL_BOOKINGS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const booking = await hallBookingsService.findById(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, booking);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.HALL_BOOKINGS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateHallBookingSchema),
    asyncHandler(async (req, res) => {
      const booking = await hallBookingsService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, booking);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.HALL_BOOKINGS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await hallBookingsService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  /**
   * @openapi
   * /hall-bookings/{id}/approve:
   *   patch:
   *     tags: [Hall Bookings]
   *     summary: Approve a pending booking (requires hall_bookings.approve)
   *     security: [{bearerAuth: []}]
   *     responses:
   *       200: {description: Approved}
   *       409: {description: Invalid status transition}
   */
  router.patch(
    '/:id/approve',
    authorize(PERMISSIONS.HALL_BOOKINGS_APPROVE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const booking = await hallBookingsService.transitionStatus(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.currentUser!.userId,
        HallBookingStatus.APPROVED,
      );
      return ok(res, booking);
    }),
  );

  router.patch(
    '/:id/reject',
    authorize(PERMISSIONS.HALL_BOOKINGS_REJECT),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const booking = await hallBookingsService.transitionStatus(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.currentUser!.userId,
        HallBookingStatus.REJECTED,
      );
      return ok(res, booking);
    }),
  );

  router.patch(
    '/:id/cancel',
    authorize(PERMISSIONS.HALL_BOOKINGS_CANCEL),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const booking = await hallBookingsService.transitionStatus(
        req.currentUser!.societyId,
        Number(req.params.id),
        req.currentUser!.userId,
        HallBookingStatus.CANCELLED,
      );
      return ok(res, booking);
    }),
  );

  return router;
}
