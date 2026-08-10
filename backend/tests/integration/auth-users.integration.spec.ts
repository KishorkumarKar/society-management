import request from 'supertest';
import {DataSource} from 'typeorm';
import {Express} from 'express';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole, TEST_PASSWORD} from '../test-utils/fixtures';
import {createApp} from '../../src/app';
import {PERMISSIONS} from '../../src/modules/acl/permissions.constants';
import {Permission} from '../../src/domain/entities/permission.entity';

describe('Integration: auth + users', () => {
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

  it('POST /auth/login returns tokens + permissions for valid credentials', async () => {
    const society = await createSociety(dataSource, {name: 'Green Valley', slug: 'green-valley'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Secretary', [PERMISSIONS.USERS_CREATE], permissionsByName);
    await createUserWithRole(dataSource, society.id, role.id, {email: 'kishor@example.com'});

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({society: 'green-valley', email: 'kishor@example.com', password: TEST_PASSWORD});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.permissions).toContain(PERMISSIONS.USERS_CREATE);
  });

  it('POST /auth/login returns 401 for wrong credentials without leaking which field was wrong', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({society: 'does-not-exist', email: 'nobody@example.com', password: 'whatever'});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('creating a user requires an access token', async () => {
    const res = await request(app).post('/api/v1/users').send({name: 'X', email: 'x@example.com', password: 'Something@123'});
    expect(res.status).toBe(401);
  });

  it('a logged-in Secretary can create a user in their own society via the API', async () => {
    const society = await createSociety(dataSource, {name: 'Green Valley', slug: 'green-valley'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Secretary',
      [PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_VIEW],
      permissionsByName,
    );
    await createUserWithRole(dataSource, society.id, role.id, {email: 'secretary@example.com'});

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({society: 'green-valley', email: 'secretary@example.com', password: TEST_PASSWORD});
    const token = login.body.data.accessToken;

    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({name: 'New Resident', email: 'resident@example.com', password: 'ResidentPass@123'});

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('New Resident');
    // password must never be echoed back
    expect(createRes.body.data.password_hash).toBeUndefined();
    expect(createRes.body.data.passwordHash).toBeUndefined();

    const listRes = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.pagination).toBeDefined();
    expect(listRes.body.data.some((u: {email: string}) => u.email === 'resident@example.com')).toBe(true);
  });

  it('a client-supplied society_id in the request body is ignored, not honored', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const role = await createRoleWithPermissions(
      dataSource,
      societyA.id,
      'Secretary',
      [PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_VIEW],
      permissionsByName,
    );
    await createUserWithRole(dataSource, societyA.id, role.id, {email: 'secretary@example.com'});

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({society: 'society-a', email: 'secretary@example.com', password: TEST_PASSWORD});
    const token = login.body.data.accessToken;

    const createRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sneaky',
        email: 'sneaky@example.com',
        password: 'SneakyPass@123',
        society_id: societyB.id, // attempted spoof
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.societyId).toBe(societyA.id); // NOT societyB.id
  });
});
