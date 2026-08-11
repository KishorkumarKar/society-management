import {Router, Request} from 'express';
import {AnnouncementsService} from './announcements.service';
import {createAnnouncementSchema, updateAnnouncementSchema, listAnnouncementsQuerySchema} from './announcements.validators';
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
import {Announcement} from '../../domain/entities/announcement.entity';

function serialize(item: {announcement: Announcement; targetRoleIds: number[]}) {
  return {...item.announcement, targetRoleIds: item.targetRoleIds};
}

/**
 * @openapi
 * tags:
 *   - name: Announcements
 *     description: Society announcements, optionally targeted to specific roles
 */
export function buildAnnouncementsRouter(announcementsService: AnnouncementsService): Router {
  const router = Router();
  router.use(authenticate, tenantIsolation);

  async function resolveCanViewAll(req: Request): Promise<boolean> {
    const aclService: AclService = req.app.locals.aclService;
    return aclService.hasAnyPermission(req.currentUser!.userId, req.currentUser!.societyId, [
      PERMISSIONS.ANNOUNCEMENTS_CREATE,
      PERMISSIONS.ANNOUNCEMENTS_UPDATE,
      PERMISSIONS.ANNOUNCEMENTS_DELETE,
      PERMISSIONS.ANNOUNCEMENTS_SEND,
    ]);
  }

  router.post(
    '/',
    authorize(PERMISSIONS.ANNOUNCEMENTS_CREATE),
    validate(createAnnouncementSchema),
    asyncHandler(async (req, res) => {
      const result = await announcementsService.create(req.currentUser!.societyId, req.currentUser!.userId, req.body);
      return ok(res, serialize(result), 201);
    }),
  );

  router.get(
    '/',
    authorize(PERMISSIONS.ANNOUNCEMENTS_VIEW),
    validate(listAnnouncementsQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const canViewAll = await resolveCanViewAll(req);
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const {search, priority, targetRole, fromDate, toDate, sort} = req.query as unknown as {
        search?: string;
        priority?: string;
        targetRole?: number;
        fromDate?: string;
        toDate?: string;
        sort: string;
      };
      const {data, total} = await announcementsService.list(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        canViewAll,
        pagination,
        {search, priority, targetRole, fromDate, toDate, sort},
      );
      return paginated(res, data.map(serialize), {page: pagination.page, limit: pagination.limit, total});
    }),
  );

  router.get(
    '/:id',
    authorize(PERMISSIONS.ANNOUNCEMENTS_VIEW),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const canViewAll = await resolveCanViewAll(req);
      const result = await announcementsService.findVisible(
        req.currentUser!.societyId,
        req.currentUser!.userId,
        Number(req.params.id),
        canViewAll,
      );
      return ok(res, serialize(result));
    }),
  );

  router.patch(
    '/:id',
    authorize(PERMISSIONS.ANNOUNCEMENTS_UPDATE),
    validate(idParamSchema, 'params'),
    validate(updateAnnouncementSchema),
    asyncHandler(async (req, res) => {
      const result = await announcementsService.update(req.currentUser!.societyId, Number(req.params.id), req.body);
      return ok(res, serialize(result));
    }),
  );

  router.delete(
    '/:id',
    authorize(PERMISSIONS.ANNOUNCEMENTS_DELETE),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      await announcementsService.softDelete(req.currentUser!.societyId, Number(req.params.id));
      return ok(res, {deleted: true});
    }),
  );

  /**
   * @openapi
   * /announcements/{id}/send:
   *   post:
   *     tags: [Announcements]
   *     summary: Dispatch an announcement — creates one notification per target user, transactionally
   *     security: [{bearerAuth: []}]
   */
  router.post(
    '/:id/send',
    authorize(PERMISSIONS.ANNOUNCEMENTS_SEND),
    validate(idParamSchema, 'params'),
    asyncHandler(async (req, res) => {
      const result = await announcementsService.send(req.currentUser!.societyId, Number(req.params.id), req.currentUser!.userId);
      return ok(res, serialize(result));
    }),
  );

  return router;
}
