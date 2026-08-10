import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole} from '../test-utils/fixtures';
import {UsersService} from '../../src/modules/users/users.service';
import {AclService} from '../../src/modules/acl/acl.service';
import {Flat} from '../../src/domain/entities/flat.entity';
import {SocietyStatus} from '../../src/domain/entities/society.entity';
import {ApiError} from '../../src/utils/api-response';
import {Permission} from '../../src/domain/entities/permission.entity';

describe('UsersService', () => {
  let dataSource: DataSource;
  let usersService: UsersService;
  let permissionsByName: Map<string, Permission>;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    usersService = new UsersService(dataSource, new AclService(dataSource));
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
    permissionsByName = await seedPermissions(dataSource);
  });

  it('creates a user scoped to the given society, ignoring nothing from the caller but societyId param', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const actor = await createUserWithRole(dataSource, society.id, role.id);

    const user = await usersService.create(society.id, actor.id, {
      name: 'New User',
      email: 'new@example.com',
      password: 'SomePass@123',
    });

    expect(user.society_id).toBe(society.id);
  });

  it('rejects creating a user when the society is inactive', async () => {
    const society = await createSociety(dataSource, {name: 'Inactive', slug: 'inactive', status: SocietyStatus.INACTIVE});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const actor = await createUserWithRole(dataSource, society.id, role.id);

    await expect(
      usersService.create(society.id, actor.id, {name: 'X', email: 'x@example.com', password: 'SomePass@123'}),
    ).rejects.toMatchObject({code: 'SOCIETY_INACTIVE'});
  });

  it('rejects creating a user once the society user_limit is reached', async () => {
    const society = await createSociety(dataSource, {name: 'Small', slug: 'small', user_limit: 1});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const actor = await createUserWithRole(dataSource, society.id, role.id); // this IS the 1st active user

    await expect(
      usersService.create(society.id, actor.id, {name: 'X', email: 'x@example.com', password: 'SomePass@123'}),
    ).rejects.toMatchObject({code: 'USER_LIMIT_REACHED'});
  });

  it('rejects attaching a flat that belongs to a different society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const role = await createRoleWithPermissions(dataSource, societyA.id, 'Resident', [], permissionsByName);
    const actor = await createUserWithRole(dataSource, societyA.id, role.id);

    const flatInB = await dataSource.getRepository(Flat).save(
      dataSource.getRepository(Flat).create({
        society_id: societyB.id,
        block: 'A',
        floor: '1',
        unit_no: 'A-101',
        sqft: '1000.00',
      }),
    );

    await expect(
      usersService.create(societyA.id, actor.id, {
        name: 'X',
        email: 'x@example.com',
        password: 'SomePass@123',
        flatId: flatInB.id,
      }),
    ).rejects.toMatchObject({code: 'FLAT_SOCIETY_MISMATCH'});
  });

  it('rejects duplicate email within the same society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const role = await createRoleWithPermissions(dataSource, society.id, 'Resident', [], permissionsByName);
    const actor = await createUserWithRole(dataSource, society.id, role.id);

    await usersService.create(society.id, actor.id, {name: 'First', email: 'dup@example.com', password: 'SomePass@123'});

    await expect(
      usersService.create(society.id, actor.id, {name: 'Second', email: 'dup@example.com', password: 'SomePass@123'}),
    ).rejects.toMatchObject({code: 'EMAIL_TAKEN'});
  });

  it('a user fetched by id must belong to the querying society (tenant isolation at the service layer)', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const roleA = await createRoleWithPermissions(dataSource, societyA.id, 'Resident', [], permissionsByName);
    const userInA = await createUserWithRole(dataSource, societyA.id, roleA.id);

    await expect(usersService.findById(societyB.id, userInA.id)).rejects.toBeInstanceOf(ApiError);
    await expect(usersService.findById(societyB.id, userInA.id)).rejects.toMatchObject({statusCode: 404});
  });
});
