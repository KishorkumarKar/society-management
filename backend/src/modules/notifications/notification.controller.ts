import {Router, Request} from 'express';
import {NotificationService} from './notification.service';
import {createNotificationSchema, updateNotificationSchema, listNotificationsQuerySchema} from './notification.validators';
import {idParamSchema} from '../societies/societies.validators';
import {validate} from '../../validators/validate.middleware';
import {authenticate} from '../../middleware/authenticate.middleware';
import {authorize} from '../../middleware/authorize.middleware';
import {tenantIsolation} from '../../middleware/tenant-isolation.middleware';
import {asyncHandler} from '../../utils/async-handler';
import {ok, paginated} from '../../utils/api-response';
import {parsePagination} from '../../utils/pagination';
import {PERMISSIONS} from '../acl/permissions.constants';
import {AclService} from '../acl/acl.service';

/**
 * @openapi
 * tags:
 *   - name: Notifications
 *     description: A user's own notifications, unless they hold notifications.view_all
 */
export function buildNotificationsRouter(notificationService: NotificationService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  /**
   * Resolves whether the caller may act on OTHER users' notifications
   * (notifications.view_all), in addition to the base notifications.view/
   * update/delete permission already checked by authorize() on the route.
   * Ownership is still the default for everyone; this only widens scope
   * for users explicitly granted the administrative permission.
   */
  async function resolveAllowAny(req: Request): Promise<boolean> {
    const aclService: AclService = req.app.locals.aclService;
    return aclService.hasPermission(req.currentUser!.userId, req.currentUser!.societyId, PERMISSIONS.NOTIFICATIONS_VIEW_ALL);
  }

  router.post(
    '/',
    authorize(PERMISSIONS.NOTIFICATIONS_CREATE),
    validate(createNotificationSchema),
    asyncHandler(async (req, res) => {
      const notification = await notificationService.create({
        societyId: req.currentUser!.societyId,
        userId: req.body.userId,
        type: req.body.type,
        title: req.body.title,
        body: req.body.body,
        channel: req.body.channel,
      });
      return ok(res, notification, 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
    validate(listNotificationsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const allowAny = await resolveAllowAny(req);
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {isRead, type, userId, sort} = req.query as unknown as {
        isRead?: boolean;
        type?: string;
        userId?: number;
        sort: string;
      };
      const {data, total} = await notificationService.list(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        allowAny,
        pagination,
        {isRead, type, targetUserId: userId, sort},
      );
      return paginated(res, data, {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  // IMPORTANT: '/read-all' MUST be registered before the '/:id' and
  // '/:id/read' routes below. Express matches routes in registration
  // order, and '/:id' would otherwise greedily match a PATCH to
  // '/read-all' with id="read-all" before this literal route is ever
  // reached.
  router.patch(
    '/read-all',
    authorize(PERMISSIONS.NOTIFICATIONS_MARK_READ),
    asyncHandler(async (req, res) => {
      const count = await notificationService.markAllRead(req.currentUser!.societyId, req.currentUser!.userId);
      return ok(res, {markedRead: count});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.NOTIFICATIONS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const allowAny = await resolveAllowAny(req);
      const notification = await notificationService.findById(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        Number(req.params.id),
        allowAny,
      );
      return ok(res, notification);
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.NOTIFICATIONS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateNotificationSchema),
    asyncHandler(async (req, res) => {
      const allowAny = await resolveAllowAny(req);
      const notification = await notificationService.update(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        Number(req.params.id),
        allowAny,
        req.body,
      );
      return ok(res, notification);
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.NOTIFICATIONS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const allowAny = await resolveAllowAny(req);
      await notificationService.softDelete(req.currentUser!.societyId, req.currentUser!.userId, Number(req.params.id), allowAny);
      return ok(res, {deleted: true});
    }),
  );

  router.patch(
    '/:id/read',
    authorize(PERMISSIONS.NOTIFICATIONS_MARK_READ),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const allowAny = await resolveAllowAny(req);
      const notification = await notificationService.markRead(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        Number(req.params.id),
        allowAny,
      );
      return ok(res, notification);
    }),
  );

  return router;
}
