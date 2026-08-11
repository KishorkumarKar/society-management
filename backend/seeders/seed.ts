import 'reflect-metadata';
import {AppDataSource} from '../src/infrastructure/database/data-source';
import {IsNull} from 'typeorm';
import {Society, RateType, SocietyStatus} from '../src/domain/entities/society.entity';
import {Flat} from '../src/domain/entities/flat.entity';
import {User} from '../src/domain/entities/user.entity';
import {Role} from '../src/domain/entities/role.entity';
import {Permission} from '../src/domain/entities/permission.entity';
import {UserRole} from '../src/domain/entities/user-role.entity';
import {RolePermission} from '../src/domain/entities/role-permission.entity';
import {MaintenanceBill, MaintenanceBillStatus} from '../src/domain/entities/maintenance-bill.entity';
import {MaintenancePayment, PaymentMethod, PaymentStatus} from '../src/domain/entities/maintenance-payment.entity';
import {HallBooking, HallBookingStatus} from '../src/domain/entities/hall-booking.entity';
import {Expense, ExpenseStatus} from '../src/domain/entities/expense.entity';
import {Announcement, AnnouncementPriority} from '../src/domain/entities/announcement.entity';
import {AnnouncementTarget} from '../src/domain/entities/announcement-target.entity';
import {Notification, NotificationChannelType} from '../src/domain/entities/notification.entity';
import {ALL_PERMISSIONS} from '../src/modules/acl/permissions.constants';
import {hashPassword} from '../src/modules/auth/password.util';
import {config} from '../src/config/env.config';

/**
 * Idempotent-ish seed script: safe to re-run against a fresh (migrated)
 * database. It does NOT attempt to be idempotent against a partially-seeded
 * database — for a repeatable dev reset, drop and re-migrate first.
 *
 * DEV/TEST CREDENTIALS ONLY. Never use these passwords in any real
 * deployment. Password below is read from SEED_DEFAULT_PASSWORD so it's at
 * least not hardcoded twice.
 */

const DEFAULT_PASSWORD = config.seedDefaultPassword;

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  'Super Admin': ALL_PERMISSIONS.map((p) => p.name), // global role, all permissions
  Secretary: [
    'users.view', 'users.create', 'users.update', 'users.delete', 'users.assign_role',
    'flats.view', 'flats.create', 'flats.update', 'flats.delete',
    'maintenance.view', 'maintenance.create', 'maintenance.update',
    'roles.view',
    // Day-to-day administration of the four new modules. Expense APPROVAL
    // is deliberately withheld — see Treasurer below — so a single role
    // can't both create and approve society spend.
    'hall_bookings.view', 'hall_bookings.create', 'hall_bookings.update', 'hall_bookings.delete',
    'hall_bookings.approve', 'hall_bookings.reject', 'hall_bookings.cancel',
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.delete',
    'announcements.view', 'announcements.create', 'announcements.update', 'announcements.delete', 'announcements.send',
    'notifications.view', 'notifications.create', 'notifications.update', 'notifications.delete',
    'notifications.mark_read', 'notifications.send', 'notifications.view_all',
  ],
  Treasurer: [
    'maintenance.view', 'maintenance.collect', 'maintenance.create', 'maintenance.update', 'flats.view',
    // Financial approval authority lives here, separate from Secretary's
    // ability to create/edit expense records — a basic separation-of-duties
    // control for money leaving the society.
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.approve',
    'hall_bookings.view', // deposits/amounts are financial data Treasurer needs visibility into
    'notifications.view', 'notifications.mark_read',
  ],
  Committee: [
    'users.view', 'flats.view', 'maintenance.view', 'roles.view',
    // "Administrators/authorized committee members can approve/reject
    // bookings" — this is that authority, without full CRUD/delete rights.
    'hall_bookings.view', 'hall_bookings.approve', 'hall_bookings.reject', 'hall_bookings.cancel',
    'expenses.view',
    'announcements.view',
    'notifications.view', 'notifications.mark_read',
  ],
  Resident: [
    'maintenance.view', 'flats.view',
    // Residents can request a booking and cancel their own — never approve/reject.
    'hall_bookings.view', 'hall_bookings.create', 'hall_bookings.cancel',
    'expenses.view', // transparency into society spend
    'announcements.view',
    'notifications.view', 'notifications.mark_read',
  ],
  Security: [
    'flats.view', 'users.view',
    'hall_bookings.view', // needed to know which halls are in use for access control
    'notifications.view', 'notifications.mark_read',
  ],
};

async function main() {
  await AppDataSource.initialize();
  console.log('Connected to database. Seeding...');

  const permissionRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const rolePermissionRepo = AppDataSource.getRepository(RolePermission);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  const societyRepo = AppDataSource.getRepository(Society);
  const flatRepo = AppDataSource.getRepository(Flat);
  const userRepo = AppDataSource.getRepository(User);
  const billRepo = AppDataSource.getRepository(MaintenanceBill);
  const paymentRepo = AppDataSource.getRepository(MaintenancePayment);
  const hallBookingRepo = AppDataSource.getRepository(HallBooking);
  const expenseRepo = AppDataSource.getRepository(Expense);
  const announcementRepo = AppDataSource.getRepository(Announcement);
  const announcementTargetRepo = AppDataSource.getRepository(AnnouncementTarget);
  const notificationRepo = AppDataSource.getRepository(Notification);

  // --- 1. Permissions catalog ---
  const permissionsByName = new Map<string, Permission>();
  for (const p of ALL_PERMISSIONS) {
    let permission = await permissionRepo.findOne({where: {resource: p.resource, action: p.action}});
    if (!permission) {
      permission = await permissionRepo.save(permissionRepo.create(p));
    }
    permissionsByName.set(p.name, permission);
  }
  console.log(`Seeded ${permissionsByName.size} permissions.`);

  // --- 2. Global Super Admin role ---
  let superAdminRole = await roleRepo.findOne({where: {name: 'Super Admin', society_id: IsNull()}});
  if (!superAdminRole) {
    superAdminRole = await roleRepo.save(
      roleRepo.create({society_id: null, name: 'Super Admin', description: 'Full system access across all societies'}),
    );
  }
  for (const permName of ROLE_PERMISSION_MAP['Super Admin']) {
    const permission = permissionsByName.get(permName)!;
    const existing = await rolePermissionRepo.findOne({where: {role_id: superAdminRole.id, permission_id: permission.id}});
    if (!existing) {
      await rolePermissionRepo.save(rolePermissionRepo.create({role_id: superAdminRole.id, permission_id: permission.id}));
    }
  }

  // --- 3. Three societies ---
  const societyDefs = [
    {name: 'Green Valley Society', city: 'Pune', slug: 'green-valley', rateType: RateType.PER_SQFT, ratePerSqft: '3.50'},
    {name: 'Sunrise Residency', city: 'Bengaluru', slug: 'sunrise-residency', rateType: RateType.FIXED, ratePerSqft: '0'},
    {name: 'Lake View Apartments', city: 'Hyderabad', slug: 'lake-view', rateType: RateType.PER_SQFT, ratePerSqft: '4.00'},
  ];

  const societies: Society[] = [];
  for (const def of societyDefs) {
    let society = await societyRepo.findOne({where: {slug: def.slug}});
    if (!society) {
      society = await societyRepo.save(
        societyRepo.create({
          name: def.name,
          city: def.city,
          address: `123 Main Road, ${def.city}`,
          slug: def.slug,
          user_limit: 200,
          registration_no: `REG-${def.slug.toUpperCase()}-2024`,
          status: SocietyStatus.ACTIVE,
          rate_type: def.rateType,
          rate_per_sqft: def.ratePerSqft,
        }),
      );
    }
    societies.push(society);
  }
  console.log(`Seeded ${societies.length} societies.`);

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const superAdminUsers: User[] = [];

  // --- 4. Per-society: roles, flats, users, bills, payments ---
  for (const society of societies) {
    // Society-scoped roles
    const societyRoles: Record<string, Role> = {};
    for (const roleName of ['Secretary', 'Treasurer', 'Committee', 'Resident', 'Security']) {
      let role = await roleRepo.findOne({where: {society_id: society.id, name: roleName}});
      if (!role) {
        role = await roleRepo.save(roleRepo.create({society_id: society.id, name: roleName, description: `${roleName} of ${society.name}`}));
      }
      societyRoles[roleName] = role;

      for (const permName of ROLE_PERMISSION_MAP[roleName]) {
        const permission = permissionsByName.get(permName)!;
        const existing = await rolePermissionRepo.findOne({where: {role_id: role.id, permission_id: permission.id}});
        if (!existing) {
          await rolePermissionRepo.save(rolePermissionRepo.create({role_id: role.id, permission_id: permission.id}));
        }
      }
    }

    // Flats: 5 per society across 2 blocks
    const flats: Flat[] = [];
    for (let i = 1; i <= 5; i++) {
      const block = i <= 3 ? 'A' : 'B';
      const unitNo = `${block}-10${i}`;
      let flat = await flatRepo.findOne({where: {society_id: society.id, block, unit_no: unitNo}});
      if (!flat) {
        flat = await flatRepo.save(
          flatRepo.create({
            society_id: society.id,
            block,
            floor: String(Math.ceil(i / 2)),
            unit_no: unitNo,
            sqft: '1200.00',
            price_per_sqft: society.rate_type === RateType.PER_SQFT ? society.rate_per_sqft : null,
            fix_price: society.rate_type === RateType.FIXED ? '4500.00' : null,
          }),
        );
      }
      flats.push(flat);
    }

    // Users: 1 secretary, 1 treasurer, 3 residents (one per remaining flat)
    const slugPrefix = society.slug.replace(/-/g, '.');

    const secretary = await upsertUser(userRepo, {
      society_id: society.id,
      flat_id: flats[0].id,
      name: `${society.name} Secretary`,
      email: `secretary@${slugPrefix}.example.com`,
      phone: null,
      password_hash: passwordHash,
    });
    await assignRoleOnce(userRoleRepo, secretary.id, societyRoles.Secretary.id);
    await flatRepo.update(flats[0].id, {owner_id: secretary.id});

    const treasurer = await upsertUser(userRepo, {
      society_id: society.id,
      flat_id: flats[1].id,
      name: `${society.name} Treasurer`,
      email: `treasurer@${slugPrefix}.example.com`,
      phone: null,
      password_hash: passwordHash,
    });
    await assignRoleOnce(userRoleRepo, treasurer.id, societyRoles.Treasurer.id);
    await flatRepo.update(flats[1].id, {owner_id: treasurer.id});

    const residents: User[] = [];
    for (let i = 2; i < flats.length; i++) {
      const resident = await upsertUser(userRepo, {
        society_id: society.id,
        flat_id: flats[i].id,
        name: `Resident ${i - 1} (${society.name})`,
        email: `resident${i - 1}@${slugPrefix}.example.com`,
        phone: null,
        password_hash: passwordHash,
      });
      await assignRoleOnce(userRoleRepo, resident.id, societyRoles.Resident.id);
      await flatRepo.update(flats[i].id, {owner_id: resident.id});
      residents.push(resident);
    }

    // One society-level Super Admin sample user (bound to Green Valley
    // for login purposes, but the Super Admin role is global so it works
    // across societies once role-based cross-society browsing is added).
    if (society.slug === 'green-valley') {
      const admin = await upsertUser(userRepo, {
        society_id: society.id,
        flat_id: null,
        name: 'Platform Super Admin',
        email: 'admin@example.com',
        phone: null,
        password_hash: passwordHash,
      });
      await assignRoleOnce(userRoleRepo, admin.id, superAdminRole.id);
      superAdminUsers.push(admin);
    }

    // Maintenance bills: current + previous month for each flat, with a mix
    // of paid / partially paid / due statuses to demonstrate the
    // amount + penalty - payments outstanding calculation.
    const now = new Date();
    const months = [
      {year: now.getFullYear(), month: now.getMonth() + 1},
      {year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(), month: now.getMonth() === 0 ? 12 : now.getMonth()},
    ];

    for (const flat of flats) {
      for (const [idx, m] of months.entries()) {
        const amount = society.rate_type === RateType.FIXED ? '4500.00' : '4200.00';
        const dueDate = new Date(m.year, m.month - 1, 10).toISOString().slice(0, 10);

        let bill = await billRepo.findOne({
          where: {society_id: society.id, flat_id: flat.id, billing_year: m.year, billing_month: m.month},
        });
        if (!bill) {
          bill = await billRepo.save(
            billRepo.create({
              society_id: society.id,
              flat_id: flat.id,
              billing_year: m.year,
              billing_month: m.month,
              amount,
              due_date: dueDate,
              status: MaintenanceBillStatus.DUE,
              penalty: '0.00',
            }),
          );
        }

        // Older month: fully paid. Current month: leave due (demonstrates
        // an outstanding balance) except one flat gets a partial payment.
        if (idx === 1) {
          const existingPayment = await paymentRepo.findOne({where: {maintenance_bill_id: bill.id}});
          if (!existingPayment) {
            await paymentRepo.save(
              paymentRepo.create({
                society_id: society.id,
                maintenance_bill_id: bill.id,
                amount,
                payment_date: dueDate,
                payment_method: PaymentMethod.UPI,
                transaction_id: `SEED-TXN-${society.id}-${flat.id}-${m.year}${m.month}`,
                status: PaymentStatus.SUCCESS,
              }),
            );
            await billRepo.update(bill.id, {status: MaintenanceBillStatus.PAID, paid_at: new Date()});
          }
        } else if (flat.unit_no.endsWith('102')) {
          const existingPayment = await paymentRepo.findOne({where: {maintenance_bill_id: bill.id}});
          if (!existingPayment) {
            await paymentRepo.save(
              paymentRepo.create({
                society_id: society.id,
                maintenance_bill_id: bill.id,
                amount: (parseFloat(amount) / 2).toFixed(2),
                payment_date: dueDate,
                payment_method: PaymentMethod.CASH,
                transaction_id: null,
                status: PaymentStatus.SUCCESS,
              }),
            );
          }
        }
      }
    }

    // --- Hall bookings: 5 across statuses/halls/dates ---
    const hallNames = ['Community Hall', 'Party Lawn'];
    const bookingSeeds = [
      {flat: flats[2], hall: hallNames[0], daysFromNow: 5, slot: '10:00-13:00', status: HallBookingStatus.PENDING},
      {flat: flats[3], hall: hallNames[0], daysFromNow: 10, slot: '17:00-21:00', status: HallBookingStatus.APPROVED},
      {flat: flats[4], hall: hallNames[1], daysFromNow: 3, slot: '09:00-12:00', status: HallBookingStatus.REJECTED},
      {flat: flats[0], hall: hallNames[1], daysFromNow: -4, slot: '18:00-22:00', status: HallBookingStatus.CANCELLED},
      {flat: flats[1], hall: hallNames[0], daysFromNow: 15, slot: '10:00-13:00', status: HallBookingStatus.PENDING},
    ];
    for (const b of bookingSeeds) {
      const bookingDate = new Date(now.getTime() + b.daysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const existing = await hallBookingRepo.findOne({
        where: {society_id: society.id, hall_name: b.hall, booking_date: bookingDate, time_slot: b.slot},
      });
      if (!existing) {
        await hallBookingRepo.save(
          hallBookingRepo.create({
            society_id: society.id,
            flat_id: b.flat.id,
            hall_name: b.hall,
            booking_date: bookingDate,
            time_slot: b.slot,
            purpose: 'Family gathering',
            status: b.status,
            amount: '1500.00',
            deposit: '500.00',
          }),
        );
      }
    }

    // --- Expenses: 10 across categories/statuses ---
    const expenseCategories = ['maintenance', 'security', 'housekeeping', 'utilities', 'repairs'];
    for (let i = 0; i < 10; i++) {
      const category = expenseCategories[i % expenseCategories.length];
      const expenseDate = new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const isApproved = i % 3 !== 0; // most approved, some pending
      const existing = await expenseRepo.findOne({
        where: {society_id: society.id, category, expense_date: expenseDate, amount: (1000 + i * 250).toFixed(2)},
      });
      if (!existing) {
        await expenseRepo.save(
          expenseRepo.create({
            society_id: society.id,
            category,
            vendor_name: `${category[0].toUpperCase()}${category.slice(1)} Vendor Co.`,
            amount: (1000 + i * 250).toFixed(2),
            expense_date: expenseDate,
            approved_by: isApproved ? treasurer.id : null,
            approved_at: isApproved ? new Date() : null,
            status: isApproved ? ExpenseStatus.APPROVED : ExpenseStatus.PENDING,
            receipt_url: null,
            description: `${category} expense for ${society.name}`,
          }),
        );
      }
    }

    // --- Announcements: 5, mixed priority and targeting ---
    const announcementSeeds = [
      {title: 'Water supply maintenance', priority: AnnouncementPriority.HIGH, roles: [] as string[]},
      {title: 'Annual General Meeting', priority: AnnouncementPriority.URGENT, roles: [] as string[]},
      {title: 'Committee meeting minutes', priority: AnnouncementPriority.NORMAL, roles: ['Committee', 'Secretary']},
      {title: 'Security protocol update', priority: AnnouncementPriority.NORMAL, roles: ['Security']},
      {title: 'Festival celebration invite', priority: AnnouncementPriority.LOW, roles: [] as string[]},
    ];
    for (const a of announcementSeeds) {
      let announcement = await announcementRepo.findOne({where: {society_id: society.id, title: a.title}});
      if (!announcement) {
        announcement = await announcementRepo.save(
          announcementRepo.create({
            society_id: society.id,
            title: a.title,
            body: `${a.title} — details for residents of ${society.name}.`,
            priority: a.priority,
            sent_at: a.roles.length === 0 ? new Date() : null,
          }),
        );
        for (const roleName of a.roles) {
          const role = societyRoles[roleName];
          if (role) {
            await announcementTargetRepo.save(announcementTargetRepo.create({announcement_id: announcement.id, role_id: role.id}));
          }
        }
      }
    }

    // --- Notifications: ~20 spread across residents, mixed read/unread and channels ---
    const notifyUsers = [secretary, treasurer, ...residents];
    const notificationTypes: {type: string; title: string; channel: NotificationChannelType}[] = [
      {type: 'maintenance.due', title: 'Maintenance bill due soon', channel: NotificationChannelType.IN_APP},
      {type: 'hall_booking.approved', title: 'Your hall booking was approved', channel: NotificationChannelType.IN_APP},
      {type: 'announcement', title: 'New announcement posted', channel: NotificationChannelType.IN_APP},
      {type: 'expense.approved', title: 'An expense was approved', channel: NotificationChannelType.EMAIL},
    ];
    for (let i = 0; i < 20; i++) {
      const user = notifyUsers[i % notifyUsers.length];
      const notifType = notificationTypes[i % notificationTypes.length];
      const existing = await notificationRepo.findOne({
        where: {society_id: society.id, user_id: user.id, type: notifType.type, title: notifType.title},
      });
      if (!existing) {
        await notificationRepo.save(
          notificationRepo.create({
            society_id: society.id,
            user_id: user.id,
            type: notifType.type,
            title: notifType.title,
            body: `${notifType.title} — ${society.name}.`,
            is_read: i % 4 === 0,
            channel: notifType.channel,
          }),
        );
      }
    }

    console.log(
      `Seeded society "${society.name}": ${flats.length} flats, roles, bills/payments, ${bookingSeeds.length} hall bookings, 10 expenses, ${announcementSeeds.length} announcements, 20 notifications.`,
    );
  }

  console.log('\n=== Seed complete ===');
  console.log('DEV/TEST CREDENTIALS ONLY — never use these in production.');
  console.log(`Password for all seeded users: ${DEFAULT_PASSWORD}\n`);
  console.log('Sample logins:');
  console.log('  Super Admin : society=green-valley  email=admin@example.com');
  console.log('  Secretary   : society=green-valley  email=secretary@green.valley.example.com');
  console.log('  Treasurer   : society=green-valley  email=treasurer@green.valley.example.com');
  console.log('  Resident    : society=green-valley  email=resident1@green.valley.example.com');
  console.log('  (same pattern for society=sunrise-residency and society=lake-view)');

  await AppDataSource.destroy();
}

async function upsertUser(
  userRepo: ReturnType<typeof AppDataSource.getRepository<User>>,
  data: {society_id: number; flat_id: number | null; name: string; email: string | null; phone: string | null; password_hash: string},
): Promise<User> {
  let user = await userRepo.findOne({where: {society_id: data.society_id, email: data.email ?? undefined}});
  if (!user) {
    user = await userRepo.save(userRepo.create({...data, is_active: true}));
  }
  return user;
}

async function assignRoleOnce(
  userRoleRepo: ReturnType<typeof AppDataSource.getRepository<UserRole>>,
  userId: number,
  roleId: number,
): Promise<void> {
  const existing = await userRoleRepo.findOne({where: {user_id: userId, role_id: roleId}});
  if (!existing) {
    await userRoleRepo.save(userRoleRepo.create({user_id: userId, role_id: roleId}));
  }
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
