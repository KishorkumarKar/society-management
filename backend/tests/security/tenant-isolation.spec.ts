import request from 'supertest';
import {DataSource} from 'typeorm';
import {Express} from 'express';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole, TEST_PASSWORD} from '../test-utils/fixtures';
import {createApp} from '../../src/app';
import {PERMISSIONS} from '../../src/modules/acl/permissions.constants';
import {Flat} from '../../src/domain/entities/flat.entity';
import {Role} from '../../src/domain/entities/role.entity';
import {Permission} from '../../src/domain/entities/permission.entity';

describe('Security: tenant isolation and permission enforcement', () => {
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

  it('a Society A user cannot fetch a Society B user by id', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(dataSource, societyA.id, 'Secretary', [PERMISSIONS.USERS_VIEW], permissionsByName);
    const roleB = await createRoleWithPermissions(dataSource, societyB.id, 'Resident', [], permissionsByName);

    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-secretary@example.com'});
    const userInB = await createUserWithRole(dataSource, societyB.id, roleB.id, {email: 'b-user@example.com'});

    const tokenA = await loginAs('society-a', 'a-secretary@example.com');

    const res = await request(app).get(`/api/v1/users/${userInB.id}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404); // not 403 — existence is not confirmed cross-tenant either
  });

  it('a Society A user cannot fetch a Society B flat by id', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(dataSource, societyA.id, 'Secretary', [PERMISSIONS.FLATS_VIEW], permissionsByName);
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-secretary@example.com'});

    const flatRepo = dataSource.getRepository(Flat);
    const flatInB = await flatRepo.save(
      flatRepo.create({society_id: societyB.id, block: 'A', floor: '1', unit_no: 'A-101', sqft: '1000.00'}),
    );

    const tokenA = await loginAs('society-a', 'a-secretary@example.com');
    const res = await request(app).get(`/api/v1/flats/${flatInB.id}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('a Society A user cannot fetch a Society B maintenance bill by id', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(
      dataSource,
      societyA.id,
      'Treasurer',
      [PERMISSIONS.MAINTENANCE_VIEW],
      permissionsByName,
    );
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-treasurer@example.com'});

    const flatRepo = dataSource.getRepository(Flat);
    const flatInB = await flatRepo.save(
      flatRepo.create({society_id: societyB.id, block: 'A', floor: '1', unit_no: 'A-101', sqft: '1000.00'}),
    );
    const billRes = await dataSource.query(
      `INSERT INTO maintenance_bills (society_id, flat_id, billing_year, billing_month, amount, due_date, status, penalty)
       VALUES (?, ?, 2026, 8, 4000.00, '2026-08-10', 'due', 0.00)`,
      [societyB.id, flatInB.id],
    );
    const billId = billRes.insertId;

    const tokenA = await loginAs('society-a', 'a-treasurer@example.com');
    const res = await request(app).get(`/api/v1/maintenance-bills/${billId}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('a Society A user cannot see a Society B role via the roles API (unless it is global)', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleA = await createRoleWithPermissions(dataSource, societyA.id, 'Secretary', [PERMISSIONS.ROLES_VIEW], permissionsByName);
    await createUserWithRole(dataSource, societyA.id, roleA.id, {email: 'a-secretary@example.com'});
    const roleB: Role = await createRoleWithPermissions(dataSource, societyB.id, 'Treasurer B', [], permissionsByName);

    const tokenA = await loginAs('society-a', 'a-secretary@example.com');
    const res = await request(app).get(`/api/v1/roles/${roleB.id}`).set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });

  it('a user WITHOUT users.create receives 403 when calling POST /users', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const roleWithoutCreate = await createRoleWithPermissions(dataSource, society.id, 'Resident', [PERMISSIONS.USERS_VIEW], permissionsByName);
    await createUserWithRole(dataSource, society.id, roleWithoutCreate.id, {email: 'resident@example.com'});

    const token = await loginAs('society-a', 'resident@example.com');
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({name: 'X', email: 'x@example.com', password: 'SomePass@123'});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('a user without any maintenance permission cannot list maintenance bills', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const bareRole = await createRoleWithPermissions(dataSource, society.id, 'Bare', [], permissionsByName);
    await createUserWithRole(dataSource, society.id, bareRole.id, {email: 'bare@example.com'});

    const token = await loginAs('society-a', 'bare@example.com');
    const res = await request(app).get('/api/v1/maintenance-bills').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('cannot assign a role from a different society to a user via the HTTP API', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const adminRoleA = await createRoleWithPermissions(
      dataSource,
      societyA.id,
      'Secretary',
      [PERMISSIONS.USERS_ASSIGN_ROLE, PERMISSIONS.USERS_VIEW],
      permissionsByName,
    );
    const admin = await createUserWithRole(dataSource, societyA.id, adminRoleA.id, {email: 'admin@example.com'});
    const targetRoleA = await createRoleWithPermissions(dataSource, societyA.id, 'Resident', [], permissionsByName);
    const target = await createUserWithRole(dataSource, societyA.id, targetRoleA.id, {email: 'target@example.com'});
    const roleInB = await createRoleWithPermissions(dataSource, societyB.id, 'Secretary B', [], permissionsByName);

    const token = await loginAs('society-a', 'admin@example.com');
    const res = await request(app)
      .post(`/api/v1/users/${target.id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({roleId: roleInB.id});

    expect(res.status).toBe(403);
    void admin;
  });
});
