import request from 'supertest';
import {DataSource} from 'typeorm';
import {Express} from 'express';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createFlat, createRoleWithPermissions, createUserWithRole, TEST_PASSWORD} from '../test-utils/fixtures';
import {createApp} from '../../src/app';
import {PERMISSIONS} from '../../src/modules/acl/permissions.constants';
import {Permission} from '../../src/domain/entities/permission.entity';
import {HallBooking, HallBookingStatus} from '../../src/domain/entities/hall-booking.entity';
import {Expense, ExpenseStatus} from '../../src/domain/entities/expense.entity';
import {Announcement, AnnouncementPriority} from '../../src/domain/entities/announcement.entity';
import {Notification} from '../../src/domain/entities/notification.entity';

describe('Security: hall-bookings, expenses, announcements, notifications', () => {
  let dataSource: DataSource;
  let app: Express;
  let permissionsByName: Map<string, Permission>;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    app = createApp(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
    permissionsByName = await seedPermissions(dataSource);
  });

  async function loginAs(societySlug: string, email: string) {
    const res = await request(app).post('/api/v1/auth/login').send({society: societySlug, email, password: TEST_PASSWORD});
    return res.body.data.accessToken as string;
  }

  // ---------------------------------------------------------------------
  // Hall bookings
  // ---------------------------------------------------------------------

  it('Society A user cannot GET, UPDATE, or DELETE a Society B hall booking', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(
      dataSource,
      societyA.id,
      'Secretary',
      [PERMISSIONS.HALL_BOOKINGS_VIEW, PERMISSIONS.HALL_BOOKINGS_UPDATE, PERMISSIONS.HALL_BOOKINGS_DELETE],
      permissionsByName,
    );
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-secretary@example.com'});

    const flatInB = await createFlat(dataSource, societyB.id);
    const bookingRepo = dataSource.getRepository(HallBooking);
    const bookingInB = await bookingRepo.save(
      bookingRepo.create({
        society_id: societyB.id,
        flat_id: flatInB.id,
        hall_name: 'Community Hall',
        booking_date: '2026-09-10',
        time_slot: '10:00-13:00',
        status: HallBookingStatus.PENDING,
        amount: '0',
        deposit: '0',
      }),
    );

    const tokenA = await loginAs('society-a', 'a-secretary@example.com');

    const getRes = await request(app).get(`/api/v1/hall-bookings/${bookingInB.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/hall-bookings/${bookingInB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({purpose: 'hijacked'});
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app).delete(`/api/v1/hall-bookings/${bookingInB.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(deleteRes.status).toBe(404);
  });

  it('a user without hall_bookings.create gets 403 on POST /hall-bookings', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Bare', [PERMISSIONS.HALL_BOOKINGS_VIEW], permissionsByName);
    await createUserWithRole(dataSource, society.id, role.id, {email: 'bare@example.com'});
    const flat = await createFlat(dataSource, society.id);

    const token = await loginAs('society-a', 'bare@example.com');
    const res = await request(app)
      .post('/api/v1/hall-bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({flatId: flat.id, hallName: 'Community Hall', bookingDate: '2026-09-10', timeSlot: '10:00-13:00'});

    expect(res.status).toBe(403);
  });

  it('a resident without hall_bookings.approve gets 403 on PATCH /hall-bookings/:id/approve', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Resident',
      [PERMISSIONS.HALL_BOOKINGS_VIEW, PERMISSIONS.HALL_BOOKINGS_CREATE],
      permissionsByName,
    );
    await createUserWithRole(dataSource, society.id, role.id, {email: 'resident@example.com'});
    const flat = await createFlat(dataSource, society.id);

    const token = await loginAs('society-a', 'resident@example.com');
    const createRes = await request(app)
      .post('/api/v1/hall-bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({flatId: flat.id, hallName: 'Community Hall', bookingDate: '2026-09-11', timeSlot: '10:00-13:00'});

    const approveRes = await request(app)
      .patch(`/api/v1/hall-bookings/${createRes.body.data.id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(approveRes.status).toBe(403);
  });

  // ---------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------

  it('Society A user cannot GET or UPDATE a Society B expense', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(
      dataSource,
      societyA.id,
      'Treasurer',
      [PERMISSIONS.EXPENSES_VIEW, PERMISSIONS.EXPENSES_UPDATE],
      permissionsByName,
    );
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-treasurer@example.com'});

    const expenseRepo = dataSource.getRepository(Expense);
    const expenseInB = await expenseRepo.save(
      expenseRepo.create({
        society_id: societyB.id,
        category: 'maintenance',
        amount: '500.00',
        expense_date: '2026-08-01',
        status: ExpenseStatus.PENDING,
      }),
    );

    const tokenA = await loginAs('society-a', 'a-treasurer@example.com');

    const getRes = await request(app).get(`/api/v1/expenses/${expenseInB.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(getRes.status).toBe(404);

    const patchRes = await request(app)
      .patch(`/api/v1/expenses/${expenseInB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({amount: 1});
    expect(patchRes.status).toBe(404);
  });

  it('approved_by is always the authenticated actor, never a client-supplied value', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Treasurer',
      [PERMISSIONS.EXPENSES_CREATE, PERMISSIONS.EXPENSES_APPROVE, PERMISSIONS.EXPENSES_VIEW],
      permissionsByName,
    );
    const treasurer = await createUserWithRole(dataSource, society.id, role.id, {email: 'treasurer@example.com'});

    const token = await loginAs('society-a', 'treasurer@example.com');
    const createRes = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({category: 'repairs', amount: 250, expenseDate: '2026-08-01'});

    const approveRes = await request(app)
      .patch(`/api/v1/expenses/${createRes.body.data.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      // Attempted spoof — the API doesn't even accept this field, and the
      // service never reads it regardless.
      .send({decision: 'approved', approvedBy: 999999});

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.approved_by).toBe(treasurer.id);
  });

  it('a user without expenses.approve gets 403 on the approve route', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Secretary',
      [PERMISSIONS.EXPENSES_CREATE, PERMISSIONS.EXPENSES_VIEW],
      permissionsByName,
    );
    await createUserWithRole(dataSource, society.id, role.id, {email: 'secretary@example.com'});

    const token = await loginAs('society-a', 'secretary@example.com');
    const createRes = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({category: 'repairs', amount: 250, expenseDate: '2026-08-01'});

    const approveRes = await request(app)
      .patch(`/api/v1/expenses/${createRes.body.data.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({decision: 'approved'});

    expect(approveRes.status).toBe(403);
  });

  // ---------------------------------------------------------------------
  // Announcements
  // ---------------------------------------------------------------------

  it('Society A user cannot GET a Society B announcement', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(dataSource, societyA.id, 'Resident', [PERMISSIONS.ANNOUNCEMENTS_VIEW], permissionsByName);
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-resident@example.com'});

    const announcementRepo = dataSource.getRepository(Announcement);
    const announcementInB = await announcementRepo.save(
      announcementRepo.create({society_id: societyB.id, title: 'B only', body: 'Body', priority: AnnouncementPriority.NORMAL}),
    );

    const tokenA = await loginAs('society-a', 'a-resident@example.com');
    const res = await request(app).get(`/api/v1/announcements/${announcementInB.id}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('a user without announcements.send gets 403 on POST /announcements/:id/send', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Secretary',
      [PERMISSIONS.ANNOUNCEMENTS_CREATE, PERMISSIONS.ANNOUNCEMENTS_VIEW],
      permissionsByName,
    );
    await createUserWithRole(dataSource, society.id, role.id, {email: 'secretary@example.com'});

    const token = await loginAs('society-a', 'secretary@example.com');
    const createRes = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({title: 'Notice', body: 'Body'});

    const sendRes = await request(app)
      .post(`/api/v1/announcements/${createRes.body.data.id}/send`)
      .set('Authorization', `Bearer ${token}`);

    expect(sendRes.status).toBe(403);
  });

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------

  it('Society A user cannot GET a Society B notification', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(dataSource, societyA.id, 'Resident', [PERMISSIONS.NOTIFICATIONS_VIEW], permissionsByName);
    const roleB = await createRoleWithPermissions(dataSource, societyB.id, 'Resident B', [], permissionsByName);
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-resident@example.com'});
    const userInB = await createUserWithRole(dataSource, societyB.id, roleB.id, {email: 'b-resident@example.com'});

    const notificationRepo = dataSource.getRepository(Notification);
    const notificationInB = await notificationRepo.save(
      notificationRepo.create({society_id: societyB.id, user_id: userInB.id, type: 'x', title: 'For B', is_read: false}),
    );

    const tokenA = await loginAs('society-a', 'a-resident@example.com');
    const res = await request(app).get(`/api/v1/notifications/${notificationInB.id}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('User A cannot read User B notification, even in the SAME society, without notifications.view_all', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [PERMISSIONS.NOTIFICATIONS_VIEW], permissionsByName);
    await createUserWithRole(dataSource, society.id, role.id, {email: 'user-a@example.com'});
    const userB = await createUserWithRole(dataSource, society.id, role.id, {email: 'user-b@example.com'});

    const notificationRepo = dataSource.getRepository(Notification);
    const notificationForB = await notificationRepo.save(
      notificationRepo.create({society_id: society.id, user_id: userB.id, type: 'x', title: 'For B', is_read: false}),
    );

    const tokenA = await loginAs('society-a', 'user-a@example.com');
    const res = await request(app).get(`/api/v1/notifications/${notificationForB.id}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('an admin WITH notifications.view_all can read another user notification in the same society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const adminRole = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Secretary',
      [PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW_ALL],
      permissionsByName,
    );
    const residentRole = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    await createUserWithRole(dataSource, society.id, adminRole.id, {email: 'admin@example.com'});
    const resident = await createUserWithRole(dataSource, society.id, residentRole.id, {email: 'resident@example.com'});

    const notificationRepo = dataSource.getRepository(Notification);
    const notificationForResident = await notificationRepo.save(
      notificationRepo.create({society_id: society.id, user_id: resident.id, type: 'x', title: 'For resident', is_read: false}),
    );

    const token = await loginAs('society-a', 'admin@example.com');
    const res = await request(app).get(`/api/v1/notifications/${notificationForResident.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('/notifications/read-all only marks the caller own notifications as read', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Resident',
      [PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.NOTIFICATIONS_MARK_READ],
      permissionsByName,
    );
    await createUserWithRole(dataSource, society.id, role.id, {email: 'user-a@example.com'});
    const userB = await createUserWithRole(dataSource, society.id, role.id, {email: 'user-b@example.com'});

    const notificationRepo = dataSource.getRepository(Notification);
    await notificationRepo.save(notificationRepo.create({society_id: society.id, user_id: userB.id, type: 'x', title: 'B1', is_read: false}));

    const tokenA = await loginAs('society-a', 'user-a@example.com');
    const res = await request(app).patch('/api/v1/notifications/read-all').set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.markedRead).toBe(0); // user A had none

    const bNotification = await notificationRepo.findOne({where: {user_id: userB.id}});
    expect(bNotification?.is_read).toBe(false); // untouched
  });
});
