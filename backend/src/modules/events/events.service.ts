import {DataSource} from 'typeorm';
import {Event, EventStatus} from '../../domain/entities/event.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateEventInput {
  name: string;
  description?: string | null;
  eventDate: string | Date;
  status?: EventStatus;
  targetAmount?: number;
}

export interface UpdateEventInput {
  name?: string;
  description?: string | null;
  eventDate?: string | Date;
  status?: EventStatus;
  targetAmount?: number;
}

export class EventsService {
  constructor(private dataSource: DataSource) {}

  /** createdBy is always the authenticated actor — never accepted from the request body. */
  async create(societyId: number, actorUserId: number, input: CreateEventInput): Promise<Event> {
    const repo = this.dataSource.getRepository(Event);

    const event = repo.create({
      society_id: societyId,
      name: input.name,
      description: input.description ?? null,
      event_date: this.toDateOnly(input.eventDate),
      status: input.status ?? EventStatus.UPCOMING,
      target_amount: String(input.targetAmount ?? 0),
      created_by: actorUserId,
    });
    const saved = await repo.save(event);

    logger.info('Event created', {actorUserId, societyId, eventId: saved.id, name: saved.name});
    return saved;
  }

  async findById(societyId: number, id: number): Promise<Event> {
    const repo = this.dataSource.getRepository(Event);
    const event = await repo.findOne({where: {id, society_id: societyId}});
    if (!event) throw ApiError.notFound('Event not found');
    return event;
  }

  /**
   * Used by the event-collections/event-expenses services to verify a
   * given eventId both exists and belongs to the caller's own society
   * before attaching a child record to it — same cross-tenant guard used
   * for flatId in HallBookingsService/MaintenanceService.
   */
  async assertBelongsToSociety(societyId: number, eventId: number): Promise<Event> {
    const event = await this.dataSource.getRepository(Event).findOne({where: {id: eventId}});
    if (!event) throw ApiError.badRequest('Event not found', 'EVENT_NOT_FOUND');
    if (event.society_id !== societyId) {
      throw ApiError.forbidden('Event belongs to a different society', 'EVENT_SOCIETY_MISMATCH');
    }
    return event;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {search?: string; status?: string; fromDate?: string | Date; toDate?: string | Date; sort: string},
  ): Promise<{data: Event[]; total: number}> {
    const repo = this.dataSource.getRepository(Event);
    const qb = repo.createQueryBuilder('event').where('event.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(event.name LIKE :search OR event.description LIKE :search)', {search: `%${filters.search}%`});
    }
    if (filters.status) qb.andWhere('event.status = :status', {status: filters.status});
    if (filters.fromDate) qb.andWhere('event.event_date >= :fromDate', {fromDate: this.toDateOnly(filters.fromDate)});
    if (filters.toDate) qb.andWhere('event.event_date <= :toDate', {toDate: this.toDateOnly(filters.toDate)});

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`event.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async update(societyId: number, id: number, input: UpdateEventInput): Promise<Event> {
    const event = await this.findById(societyId, id);
    const repo = this.dataSource.getRepository(Event);

    if (input.name !== undefined) event.name = input.name;
    if (input.description !== undefined) event.description = input.description;
    if (input.eventDate !== undefined) event.event_date = this.toDateOnly(input.eventDate);
    if (input.status !== undefined) event.status = input.status;
    if (input.targetAmount !== undefined) event.target_amount = String(input.targetAmount);

    return repo.save(event);
  }

  /**
   * Soft-delete only, same as every other financial/record-keeping module
   * here. The event's collections/expenses are left in place (they're
   * independently soft-deletable) — nothing here cascades a delete over
   * the API; a real hard DELETE (which the API never issues) would cascade
   * at the DB level per the migration's FK definition.
   */
  async softDelete(societyId: number, id: number): Promise<void> {
    const event = await this.findById(societyId, id);
    await this.dataSource.getRepository(Event).softDelete(event.id);
  }

  private toDateOnly(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  }
}
