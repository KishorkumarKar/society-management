import {DataSource} from 'typeorm';
import {Flat} from '../../domain/entities/flat.entity';
import {User} from '../../domain/entities/user.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';

export interface CreateFlatInput {
  block: string;
  floor: string;
  unitNo: string;
  ownerId?: number | null;
  sqft: number;
  pricePerSqft?: number | null;
  fixPrice?: number | null;
}

export interface UpdateFlatInput {
  block?: string;
  floor?: string;
  unitNo?: string;
  ownerId?: number | null;
  sqft?: number;
  pricePerSqft?: number | null;
  fixPrice?: number | null;
}

export class FlatsService {
  constructor(private dataSource: DataSource) {}

  async create(societyId: number, input: CreateFlatInput): Promise<Flat> {
    const repo = this.dataSource.getRepository(Flat);

    if (input.ownerId) {
      await this.assertOwnerBelongsToSociety(societyId, input.ownerId);
    }

    const existing = await repo.findOne({where: {society_id: societyId, block: input.block, unit_no: input.unitNo}});
    if (existing) {
      throw ApiError.conflict('A flat with this block/unit already exists in this society', 'FLAT_DUPLICATE');
    }

    const flat = repo.create({
      society_id: societyId,
      block: input.block,
      floor: input.floor,
      unit_no: input.unitNo,
      owner_id: input.ownerId ?? null,
      sqft: String(input.sqft),
      price_per_sqft: input.pricePerSqft != null ? String(input.pricePerSqft) : null,
      fix_price: input.fixPrice != null ? String(input.fixPrice) : null,
    });

    return repo.save(flat);
  }

  async findById(societyId: number, id: number): Promise<Flat> {
    const repo = this.dataSource.getRepository(Flat);
    const flat = await repo.findOne({where: {id, society_id: societyId}});
    if (!flat) throw ApiError.notFound('Flat not found');
    return flat;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {search?: string; block?: string; sort: string},
  ): Promise<{data: Flat[]; total: number}> {
    const repo = this.dataSource.getRepository(Flat);
    const qb = repo.createQueryBuilder('flat').where('flat.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(flat.unit_no LIKE :search OR flat.block LIKE :search)', {search: `%${filters.search}%`});
    }
    if (filters.block) {
      qb.andWhere('flat.block = :block', {block: filters.block});
    }

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`flat.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async update(societyId: number, id: number, input: UpdateFlatInput): Promise<Flat> {
    const flat = await this.findById(societyId, id);
    const repo = this.dataSource.getRepository(Flat);

    if (input.ownerId !== undefined) {
      if (input.ownerId === null) {
        flat.owner_id = null;
      } else {
        await this.assertOwnerBelongsToSociety(societyId, input.ownerId);
        flat.owner_id = input.ownerId;
      }
    }

    if (input.block !== undefined) flat.block = input.block;
    if (input.floor !== undefined) flat.floor = input.floor;
    if (input.unitNo !== undefined) flat.unit_no = input.unitNo;
    if (input.sqft !== undefined) flat.sqft = String(input.sqft);
    if (input.pricePerSqft !== undefined) flat.price_per_sqft = input.pricePerSqft != null ? String(input.pricePerSqft) : null;
    if (input.fixPrice !== undefined) flat.fix_price = input.fixPrice != null ? String(input.fixPrice) : null;

    return repo.save(flat);
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const flat = await this.findById(societyId, id);
    await this.dataSource.getRepository(Flat).softDelete(flat.id);
  }

  /**
   * A flat's owner must be a user of the SAME society — never trusts the
   * caller, always re-derives from the DB. This is the enforcement point
   * for "a user cannot be assigned to a flat from another society" viewed
   * from the flat's side of the relationship.
   */
  private async assertOwnerBelongsToSociety(societyId: number, ownerId: number): Promise<void> {
    const owner = await this.dataSource.getRepository(User).findOne({where: {id: ownerId}});
    if (!owner) throw ApiError.badRequest('Owner user not found', 'OWNER_NOT_FOUND');
    if (owner.society_id !== societyId) {
      throw ApiError.forbidden('Owner must belong to the same society as the flat', 'OWNER_SOCIETY_MISMATCH');
    }
  }
}
