import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole} from '../test-utils/fixtures';
import {AclService, ForbiddenRoleAssignmentError} from '../../src/modules/acl/acl.service';
import {Permission} from '../../src/domain/entities/permission.entity';
import {PERMISSIONS} from '../../src/modules/acl/permissions.constants';

describe('AclService', () => {
  let dataSource: DataSource;
  let aclService: AclService;
  let permissionsByName: Map<string, Permission>;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    aclService = new AclService(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
    permissionsByName = await seedPermissions(dataSource);
  });

  it('resolves permissions through user -> user_roles -> roles -> role_permissions', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Treasurer',
      [PERMISSIONS.MAINTENANCE_VIEW, PERMISSIONS.MAINTENANCE_COLLECT],
      permissionsByName,
    );
    const user = await createUserWithRole(dataSource, society.id, role.id);

    const hasView = await aclService.hasPermission(user.id, society.id, PERMISSIONS.MAINTENANCE_VIEW);
    const hasDelete = await aclService.hasPermission(user.id, society.id, PERMISSIONS.MAINTENANCE_DELETE);

    expect(hasView).toBe(true);
    expect(hasDelete).toBe(false);
  });

  it('rejects assigning a society-scoped role from a different society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});

    const roleInB = await createRoleWithPermissions(dataSource, societyB.id, 'Secretary B', [], permissionsByName);
    const baseRoleInA = await createRoleWithPermissions(dataSource, societyA.id, 'Resident A', [], permissionsByName);
    const userInA = await createUserWithRole(dataSource, societyA.id, baseRoleInA.id);

    await expect(aclService.assignRole(userInA.id, roleInB.id, userInA.id)).rejects.toBeInstanceOf(
      ForbiddenRoleAssignmentError,
    );
  });

  it('allows assigning a global role regardless of the user society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const globalRole = await createRoleWithPermissions(dataSource, null, 'Super Admin', [], permissionsByName);
    const baseRole = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const user = await createUserWithRole(dataSource, society.id, baseRole.id);

    await expect(aclService.assignRole(user.id, globalRole.id, user.id)).resolves.toBeUndefined();
  });

  it('invalidates the permission cache after a role assignment', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const emptyRole = await createRoleWithPermissions(dataSource, society.id, 'Nothing', [], permissionsByName);
    const grantingRole = await createRoleWithPermissions(
      dataSource,
      society.id,
      'Grants view',
      [PERMISSIONS.USERS_VIEW],
      permissionsByName,
    );
    const user = await createUserWithRole(dataSource, society.id, emptyRole.id);

    expect(await aclService.hasPermission(user.id, society.id, PERMISSIONS.USERS_VIEW)).toBe(false);

    await aclService.assignRole(user.id, grantingRole.id, user.id);

    expect(await aclService.hasPermission(user.id, society.id, PERMISSIONS.USERS_VIEW)).toBe(true);
  });
});
