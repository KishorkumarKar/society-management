import {DataSource} from 'typeorm';
import {Society} from '../../domain/entities/society.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';

export interface CreateSocietyInput {
  name: string;
  city: string;
  address: string;
  slug: string;
  userLimit: number;
  registrationNo?: string | null;
  rateType: 'PER_SQFT' | 'FIXED';
  ratePerSqft: number;
}

export interface UpdateSocietyInput {
  name?: string;
  city?: string;
  address?: string;
  userLimit?: number;
  registrationNo?: string | null;
  status?: 0 | 1;
  rateType?: 'PER_SQFT' | 'FIXED';
  ratePerSqft?: number;
}

/**
 * Societies are the tenant root, not a tenant-scoped resource — access is
 * governed purely by the `societies.*` permissions (seeded only onto the
 * global Super Admin role), NOT by tenant-isolation middleware, which would
 * make no sense applied to the table that defines the tenants.
 */
export class SocietiesService {
  constructor(private dataSource: DataSource) {}

  async create(input: CreateSocietyInput): Promise<Society> {
    const repo = this.dataSource.getRepository(Society);

    const existingSlug = await repo.findOne({where: {slug: input.slug}});
    if (existingSlug) throw ApiError.conflict('A society with this slug already exists', 'SLUG_TAKEN');

    const society = repo.create({
      name: input.name,
      city: input.city,
      address: input.address,
      slug: input.slug,
      user_limit: input.userLimit,
      registration_no: input.registrationNo ?? null,
      rate_type: input.rateType as Society['rate_type'],
      rate_per_sqft: String(input.ratePerSqft),
    });

    return repo.save(society);
  }

  async findById(id: number): Promise<Society> {
    const repo = this.dataSource.getRepository(Society);
    const society = await repo.findOne({where: {id}});
    if (!society) throw ApiError.notFound('Society not found');
    return society;
  }

  async list(
    pagination: PaginationQuery,
    filters: {search?: string; status?: 0 | 1; sort: string},
  ): Promise<{data: Society[]; total: number}> {
    const repo = this.dataSource.getRepository(Society);
    const qb = repo.createQueryBuilder('society');

    if (filters.search) {
      qb.andWhere('(society.name LIKE :search OR society.slug LIKE :search OR society.city LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.status !== undefined) {
      qb.andWhere('society.status = :status', {status: filters.status});
    }

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`society.${sortField}`, sortDir);

    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async update(id: number, input: UpdateSocietyInput): Promise<Society> {
    const society = await this.findById(id);

    if (input.name !== undefined) society.name = input.name;
    if (input.city !== undefined) society.city = input.city;
    if (input.address !== undefined) society.address = input.address;
    if (input.userLimit !== undefined) society.user_limit = input.userLimit;
    if (input.registrationNo !== undefined) society.registration_no = input.registrationNo;
    if (input.status !== undefined) society.status = input.status;
    if (input.rateType !== undefined) society.rate_type = input.rateType as Society['rate_type'];
    if (input.ratePerSqft !== undefined) society.rate_per_sqft = String(input.ratePerSqft);

    return this.dataSource.getRepository(Society).save(society);
  }

  async softDelete(id: number): Promise<void> {
    const repo = this.dataSource.getRepository(Society);
    const society = await this.findById(id);
    await repo.softDelete(society.id);
  }
}
