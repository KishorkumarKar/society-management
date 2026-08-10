import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole, TEST_PASSWORD} from '../test-utils/fixtures';
import {AuthService} from '../../src/modules/auth/auth.service';
import {AclService} from '../../src/modules/acl/acl.service';
import {SocietyStatus} from '../../src/domain/entities/society.entity';
import {User} from '../../src/domain/entities/user.entity';
import {ApiError} from '../../src/utils/api-response';

describe('AuthService', () => {
  let dataSource: DataSource;
  let authService: AuthService;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    authService = new AuthService(dataSource, new AclService(dataSource));
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  it('logs in a user with correct society + email + password', async () => {
    const permissionsByName = await seedPermissions(dataSource);
    const society = await createSociety(dataSource, {name: 'Green Valley', slug: 'green-valley'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const user = await createUserWithRole(dataSource, society.id, role.id, {email: 'kishor@example.com'});

    const result = await authService.login({society: 'green-valley', email: 'kishor@example.com', password: TEST_PASSWORD});

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.id).toBe(user.id);
    expect(result.society.slug).toBe('green-valley');
  });

  it('rejects a wrong password with a generic error', async () => {
    const society = await createSociety(dataSource, {name: 'Green Valley', slug: 'green-valley'});
    await createUserWithRoleShortcut(dataSource, society.id, 'kishor@example.com');

    await expect(
      authService.login({society: 'green-valley', email: 'kishor@example.com', password: 'wrong-password'}),
    ).rejects.toMatchObject({statusCode: 401});
  });

  it('never allows a user to authenticate into a DIFFERENT society by supplying the right email/password there', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    await createUserWithRoleShortcut(dataSource, societyA.id, 'shared@example.com');

    // The email exists in Society A, not Society B — logging in against
    // society-b with that email must fail even with the correct password.
    await expect(
      authService.login({society: 'society-b', email: 'shared@example.com', password: TEST_PASSWORD}),
    ).rejects.toMatchObject({statusCode: 401});
  });

  it('rejects login for an inactive society', async () => {
    const society = await createSociety(dataSource, {name: 'Inactive Co', slug: 'inactive-co', status: SocietyStatus.INACTIVE});
    await createUserWithRoleShortcut(dataSource, society.id, 'user@example.com');

    await expect(
      authService.login({society: 'inactive-co', email: 'user@example.com', password: TEST_PASSWORD}),
    ).rejects.toMatchObject({statusCode: 403, code: 'SOCIETY_INACTIVE'});
  });

  it('rejects login for an inactive user', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const user = await createUserWithRoleShortcut(dataSource, society.id, 'user@example.com');
    await dataSource.getRepository(User).update(user.id, {is_active: false});

    await expect(
      authService.login({society: 'society-a', email: 'user@example.com', password: TEST_PASSWORD}),
    ).rejects.toMatchObject({statusCode: 403, code: 'USER_INACTIVE'});
  });

  it('rotates refresh tokens and revokes the old one on refresh', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    await createUserWithRoleShortcut(dataSource, society.id, 'user@example.com');

    const {refreshToken} = await authService.login({society: 'society-a', email: 'user@example.com', password: TEST_PASSWORD});
    const rotated = await authService.refresh(refreshToken);

    expect(rotated.accessToken).toEqual(expect.any(String));
    expect(rotated.refreshToken).not.toBe(refreshToken);

    // The original refresh token must now be rejected (single-use / rotation).
    await expect(authService.refresh(refreshToken)).rejects.toBeInstanceOf(ApiError);
  });
});

async function createUserWithRoleShortcut(dataSource: DataSource, societyId: number, email: string) {
  const permissionsByName = await seedPermissions(dataSource);
  const role = await createRoleWithPermissions(dataSource, societyId, 'Resident', [], permissionsByName);
  return createUserWithRole(dataSource, societyId, role.id, {email});
}
