import {DataSource} from 'typeorm';
import {Permission} from '../../domain/entities/permission.entity';
import {PaginationQuery} from '../../utils/pagination';

/**
 * Permissions are catalog data seeded from PERMISSIONS constants (see
 * modules/acl/permissions.constants.ts) — this module is deliberately
 * read-mostly. Creating ad-hoc permissions through the API is supported
 * (spec section 15) but kept separate from the seeded catalog to avoid
 * accidental typos producing permissions no role can ever practically use.
 */
export class PermissionsService {
  constructor(private dataSource: DataSource) {}

  async list(pagination: PaginationQuery, filters: {resource?: string; search?: string}): Promise<{data: Permission[]; total: number}> {
    const repo = this.dataSource.getRepository(Permission);
    const qb = repo.createQueryBuilder('permission');

    if (filters.resource) {
      qb.andWhere('permission.resource = :resource', {resource: filters.resource});
    }
    if (filters.search) {
      qb.andWhere('permission.name LIKE :search', {search: `%${filters.search}%`});
    }

    qb.orderBy('permission.resource', 'ASC').addOrderBy('permission.action', 'ASC');
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async create(name: string, resource: string, action: string, description?: string | null): Promise<Permission> {
    const repo = this.dataSource.getRepository(Permission);
    const permission = repo.create({name, resource, action, description: description ?? null});
    return repo.save(permission);
  }
}
