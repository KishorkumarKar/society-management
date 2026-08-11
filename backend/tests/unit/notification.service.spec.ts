import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {createSociety} from '../test-utils/fixtures';
import {NotificationService} from '../../src/modules/notifications/notification.service';
import {NotificationChannelType} from '../../src/domain/entities/notification.entity';
import {User} from '../../src/domain/entities/user.entity';

describe('NotificationService', () => {
  let dataSource: DataSource;
  let notificationService: NotificationService;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    notificationService = new NotificationService(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  async function makeUser(societyId: number) {
    const repo = dataSource.getRepository(User);
    return repo.save(
      repo.create({
        society_id: societyId,
        flat_id: null,
        name: 'Test User',
        email: `u-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        phone: null,
        password_hash: 'irrelevant-for-this-test',
        is_active: true,
      }),
    );
  }

  it('creates a notification and dispatches it through the requested channel without throwing', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const user = await makeUser(society.id);

    const notification = await notificationService.create({
      societyId: society.id,
      userId: user.id,
      type: 'test.event',
      title: 'Hello',
      channel: NotificationChannelType.EMAIL,
    });

    expect(notification.is_read).toBe(false);
    expect(notification.channel).toBe(NotificationChannelType.EMAIL);
  });

  it('rejects creating a notification for a user in a DIFFERENT society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const userInB = await makeUser(societyB.id);

    await expect(
      notificationService.create({societyId: societyA.id, userId: userInB.id, type: 'x', title: 'X'}),
    ).rejects.toMatchObject({code: 'USER_SOCIETY_MISMATCH'});
  });

  it('user A cannot read user B notification even in the same society (ownership, not just tenant)', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const userA = await makeUser(society.id);
    const userB = await makeUser(society.id);

    const notificationForB = await notificationService.create({
      societyId: society.id,
      userId: userB.id,
      type: 'x',
      title: 'For B only',
    });

    await expect(
      notificationService.findById(society.id, userA.id, notificationForB.id, /* allowAnyInSociety */ false),
    ).rejects.toMatchObject({statusCode: 404});
  });

  it('an admin with allowAnyInSociety=true CAN read another user notification in the same society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const admin = await makeUser(society.id);
    const resident = await makeUser(society.id);

    const notificationForResident = await notificationService.create({
      societyId: society.id,
      userId: resident.id,
      type: 'x',
      title: 'For resident',
    });

    const fetched = await notificationService.findById(society.id, admin.id, notificationForResident.id, true);
    expect(fetched.id).toBe(notificationForResident.id);
  });

  it('allowAnyInSociety never crosses a society boundary', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const adminInA = await makeUser(societyA.id);
    const userInB = await makeUser(societyB.id);

    const notificationForB = await notificationService.create({societyId: societyB.id, userId: userInB.id, type: 'x', title: 'X'});

    await expect(
      notificationService.findById(societyA.id, adminInA.id, notificationForB.id, true),
    ).rejects.toMatchObject({statusCode: 404});
  });

  it('markRead only affects the target notification and is idempotent', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const user = await makeUser(society.id);
    const notification = await notificationService.create({societyId: society.id, userId: user.id, type: 'x', title: 'X'});

    const first = await notificationService.markRead(society.id, user.id, notification.id, false);
    expect(first.is_read).toBe(true);

    const second = await notificationService.markRead(society.id, user.id, notification.id, false);
    expect(second.is_read).toBe(true);
  });

  it('markAllRead only marks the CALLING user own notifications', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const userA = await makeUser(society.id);
    const userB = await makeUser(society.id);

    await notificationService.create({societyId: society.id, userId: userA.id, type: 'x', title: 'A1'});
    await notificationService.create({societyId: society.id, userId: userA.id, type: 'x', title: 'A2'});
    const forB = await notificationService.create({societyId: society.id, userId: userB.id, type: 'x', title: 'B1'});

    const count = await notificationService.markAllRead(society.id, userA.id);
    expect(count).toBe(2);

    const bStillUnread = await notificationService.findById(society.id, userB.id, forB.id, false);
    expect(bStillUnread.is_read).toBe(false);
  });

  it('a user cannot delete another user notification without allowAnyInSociety', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const userA = await makeUser(society.id);
    const userB = await makeUser(society.id);
    const forB = await notificationService.create({societyId: society.id, userId: userB.id, type: 'x', title: 'B1'});

    await expect(notificationService.softDelete(society.id, userA.id, forB.id, false)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
