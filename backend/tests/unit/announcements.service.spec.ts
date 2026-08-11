import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole} from '../test-utils/fixtures';
import {AnnouncementsService} from '../../src/modules/announcements/announcements.service';
import {NotificationService} from '../../src/modules/notifications/notification.service';
import {AnnouncementPriority} from '../../src/domain/entities/announcement.entity';
import {Permission} from '../../src/domain/entities/permission.entity';
import {Notification} from '../../src/domain/entities/notification.entity';

describe('AnnouncementsService', () => {
  let dataSource: DataSource;
  let announcementsService: AnnouncementsService;
  let permissionsByName: Map<string, Permission>;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    announcementsService = new AnnouncementsService(dataSource, new NotificationService(dataSource));
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
    permissionsByName = await seedPermissions(dataSource);
  });

  it('creates a society-wide announcement when no target roles are given', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const result = await announcementsService.create(society.id, 1, {
      title: 'AGM',
      body: 'Annual general meeting notice.',
      priority: AnnouncementPriority.URGENT,
    });

    expect(result.targetRoleIds).toEqual([]);
    expect(result.announcement.priority).toBe(AnnouncementPriority.URGENT);
  });

  it('rejects targeting a role from a different society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const roleInB = await createRoleWithPermissions(dataSource, societyB.id, 'Committee B', [], permissionsByName);

    await expect(
      announcementsService.create(societyA.id, 1, {title: 'X', body: 'Y', targetRoleIds: [roleInB.id]}),
    ).rejects.toMatchObject({code: 'ROLE_SOCIETY_MISMATCH'});
  });

  it('a role-targeted announcement is visible to a holder of that role, not to others', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const committeeRole = await createRoleWithPermissions(dataSource, society.id, 'Committee', [], permissionsByName);
    const residentRole = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const committeeUser = await createUserWithRole(dataSource, society.id, committeeRole.id);
    const residentUser = await createUserWithRole(dataSource, society.id, residentRole.id);

    const {announcement} = await announcementsService.create(society.id, 1, {
      title: 'Committee only',
      body: 'Internal notice.',
      targetRoleIds: [committeeRole.id],
    });

    // The committee member can see it.
    await expect(announcementsService.findVisible(society.id, committeeUser.id, announcement.id, false)).resolves.toBeDefined();

    // The resident cannot.
    await expect(
      announcementsService.findVisible(society.id, residentUser.id, announcement.id, false),
    ).rejects.toMatchObject({statusCode: 404});
  });

  it('a manager (canViewAll) can see a role-targeted announcement regardless of their own roles', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const committeeRole = await createRoleWithPermissions(dataSource, society.id, 'Committee', [], permissionsByName);
    const secretaryRole = await createRoleWithPermissions(dataSource, society.id, 'Secretary', [], permissionsByName);
    const secretary = await createUserWithRole(dataSource, society.id, secretaryRole.id);

    const {announcement} = await announcementsService.create(society.id, 1, {
      title: 'Committee only',
      body: 'Internal notice.',
      targetRoleIds: [committeeRole.id],
    });

    await expect(announcementsService.findVisible(society.id, secretary.id, announcement.id, true)).resolves.toBeDefined();
  });

  it('sending a society-wide announcement creates one notification per active user in the society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const userA = await createUserWithRole(dataSource, society.id, role.id);
    const userB = await createUserWithRole(dataSource, society.id, role.id);

    const {announcement} = await announcementsService.create(society.id, 1, {title: 'Notice', body: 'Body'});
    await announcementsService.send(society.id, announcement.id, 1);

    const notifications = await dataSource.getRepository(Notification).find({where: {society_id: society.id}});
    const recipientIds = notifications.map((n) => n.user_id).sort();
    expect(recipientIds).toEqual([userA.id, userB.id].sort());
  });

  it('sending a role-targeted announcement only notifies holders of that role', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const committeeRole = await createRoleWithPermissions(dataSource, society.id, 'Committee', [], permissionsByName);
    const residentRole = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const committeeUser = await createUserWithRole(dataSource, society.id, committeeRole.id);
    await createUserWithRole(dataSource, society.id, residentRole.id); // should NOT be notified

    const {announcement} = await announcementsService.create(society.id, 1, {
      title: 'Committee notice',
      body: 'Body',
      targetRoleIds: [committeeRole.id],
    });
    await announcementsService.send(society.id, announcement.id, 1);

    const notifications = await dataSource.getRepository(Notification).find({where: {society_id: society.id}});
    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toBe(committeeUser.id);
  });

  it('rejects sending an announcement twice', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const {announcement} = await announcementsService.create(society.id, 1, {title: 'Notice', body: 'Body'});
    await announcementsService.send(society.id, announcement.id, 1);

    await expect(announcementsService.send(society.id, announcement.id, 1)).rejects.toMatchObject({
      code: 'ANNOUNCEMENT_ALREADY_SENT',
    });
  });

  it('rejects editing an announcement that has already been sent', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const {announcement} = await announcementsService.create(society.id, 1, {title: 'Notice', body: 'Body'});
    await announcementsService.send(society.id, announcement.id, 1);

    await expect(announcementsService.update(society.id, announcement.id, {title: 'Edited'})).rejects.toMatchObject({
      code: 'ANNOUNCEMENT_ALREADY_SENT',
    });
  });
});
