import {DataSource} from 'typeorm';
import {Society, RateType, SocietyStatus} from '../../src/domain/entities/society.entity';
import {Role} from '../../src/domain/entities/role.entity';
import {Permission} from '../../src/domain/entities/permission.entity';
import {RolePermission} from '../../src/domain/entities/role-permission.entity';
import {UserRole} from '../../src/domain/entities/user-role.entity';
import {User} from '../../src/domain/entities/user.entity';
import {Flat} from '../../src/domain/entities/flat.entity';
import {hashPassword} from '../../src/modules/auth/password.util';
import {ALL_PERMISSIONS, PERMISSIONS} from '../../src/modules/acl/permissions.constants';

export const TEST_PASSWORD = 'TestPass@123';

export async function seedPermissions(dataSource: DataSource): Promise<Map<string, Permission>> {
  const repo = dataSource.getRepository(Permission);
  const map = new Map<string, Permission>();
  for (const p of ALL_PERMISSIONS) {
    const saved = await repo.save(repo.create(p));
    map.set(p.name, saved);
  }
  return map;
}

export async function createSociety(
  dataSource: DataSource,
  overrides: Partial<Society> & {slug: string; name: string},
): Promise<Society> {
  const repo = dataSource.getRepository(Society);
  return repo.save(
    repo.create({
      city: 'Test City',
      address: '1 Test Street',
      user_limit: 100,
      registration_no: null,
      status: SocietyStatus.ACTIVE,
      rate_type: RateType.PER_SQFT,
      rate_per_sqft: '3.00',
      ...overrides,
    }),
  );
}

/** Creates a role in `society` with the given permission names and returns the role. */
export async function createRoleWithPermissions(
  dataSource: DataSource,
  societyId: number | null,
  roleName: string,
  permissionNames: string[],
  permissionsByName: Map<string, Permission>,
): Promise<Role> {
  const roleRepo = dataSource.getRepository(Role);
  const rolePermissionRepo = dataSource.getRepository(RolePermission);

  const role = await roleRepo.save(roleRepo.create({society_id: societyId, name: roleName}));
  for (const name of permissionNames) {
    const permission = permissionsByName.get(name);
    if (!permission) throw new Error(`Unknown permission in fixture: ${name}`);
    await rolePermissionRepo.save(rolePermissionRepo.create({role_id: role.id, permission_id: permission.id}));
  }
  return role;
}

export async function createUserWithRole(
  dataSource: DataSource,
  societyId: number,
  roleId: number,
  overrides: Partial<Pick<User, 'name' | 'email' | 'phone'>> = {},
): Promise<User> {
  const userRepo = dataSource.getRepository(User);
  const userRoleRepo = dataSource.getRepository(UserRole);

  const user = await userRepo.save(
    userRepo.create({
      society_id: societyId,
      flat_id: null,
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      phone: overrides.phone ?? null,
      password_hash: await hashPassword(TEST_PASSWORD),
      is_active: true,
    }),
  );
  await userRoleRepo.save(userRoleRepo.create({user_id: user.id, role_id: roleId}));
  return user;
}

export async function createFlat(
  dataSource: DataSource,
  societyId: number,
  overrides: Partial<Pick<Flat, 'block' | 'floor' | 'unit_no' | 'sqft'>> = {},
): Promise<Flat> {
  const repo = dataSource.getRepository(Flat);
  return repo.save(
    repo.create({
      society_id: societyId,
      block: overrides.block ?? 'A',
      floor: overrides.floor ?? '1',
      unit_no: overrides.unit_no ?? `A-${Date.now()}${Math.floor(Math.random() * 1000)}`,
      sqft: overrides.sqft ?? '1000.00',
    }),
  );
}

/** Convenience: full-permission role for a given society, for tests that just need "an admin". */
export async function createFullAccessUser(
  dataSource: DataSource,
  societyId: number,
  permissionsByName: Map<string, Permission>,
): Promise<User> {
  const role = await createRoleWithPermissions(
    dataSource,
    societyId,
    `Full Access ${societyId}`,
    Object.values(PERMISSIONS),
    permissionsByName,
  );
  return createUserWithRole(dataSource, societyId, role.id, {name: 'Full Access User'});
}
