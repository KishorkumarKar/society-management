import {DataSource} from 'typeorm';
import {EventCollection, EventCollectionStatus} from '../../domain/entities/event-collection.entity';
import {EventsService} from '../events/events.service';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateEventCollectionInput {
  eventId: number;
  memberName: string;
  unit: string;
  amountDue: number;
  amountPaid?: number;
  paymentDate?: string | Date | null;
  status?: EventCollectionStatus;
  notes?: string | null;
}

export interface UpdateEventCollectionInput {
  memberName?: string;
  unit?: string;
  amountDue?: number;
  amountPaid?: number;
  paymentDate?: string | Date | null;
  status?: EventCollectionStatus;
  notes?: string | null;
}

export class EventCollectionsService {
  constructor(
    private dataSource: DataSource,
    private eventsService: EventsService,
  ) {}

  async create(societyId: number, actorUserId: number, input: CreateEventCollectionInput): Promise<EventCollection> {
    // Verifies the event exists AND belongs to this society before anything is attached to it.
    await this.eventsService.assertBelongsToSociety(societyId, input.eventId);

    const repo = this.dataSource.getRepository(EventCollection);
    const amountDue = input.amountDue;
    const amountPaid = input.amountPaid ?? 0;

    const collection = repo.create({
      society_id: societyId,
      event_id: input.eventId,
      member_name: input.memberName,
      unit: input.unit,
      amount_due: String(amountDue),
      amount_paid: String(amountPaid),
      payment_date: input.paymentDate != null ? this.toDateOnly(input.paymentDate) : null,
      status: input.status ?? this.deriveStatus(amountDue, amountPaid),
      notes: input.notes ?? null,
    });
    const saved = await repo.save(collection);

    logger.info('Event collection created', {
      actorUserId,
      societyId,
      eventId: input.eventId,
      collectionId: saved.id,
    });
    return saved;
  }

  async findById(societyId: number, id: number): Promise<EventCollection> {
    const repo = this.dataSource.getRepository(EventCollection);
    const collection = await repo.findOne({where: {id, society_id: societyId}});
    if (!collection) throw ApiError.notFound('Event collection not found');
    return collection;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {search?: string; eventId?: number; status?: string; unit?: string; sort: string},
  ): Promise<{data: EventCollection[]; total: number}> {
    const repo = this.dataSource.getRepository(EventCollection);
    const qb = repo.createQueryBuilder('collection').where('collection.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(collection.member_name LIKE :search OR collection.notes LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.eventId) qb.andWhere('collection.event_id = :eventId', {eventId: filters.eventId});
    if (filters.status) qb.andWhere('collection.status = :status', {status: filters.status});
    if (filters.unit) qb.andWhere('collection.unit = :unit', {unit: filters.unit});

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`collection.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  /** eventId is deliberately not editable here — move a collection to a different event by deleting/recreating it. */
  async update(societyId: number, id: number, input: UpdateEventCollectionInput): Promise<EventCollection> {
    const collection = await this.findById(societyId, id);
    const repo = this.dataSource.getRepository(EventCollection);

    if (input.memberName !== undefined) collection.member_name = input.memberName;
    if (input.unit !== undefined) collection.unit = input.unit;
    if (input.amountDue !== undefined) collection.amount_due = String(input.amountDue);
    if (input.amountPaid !== undefined) collection.amount_paid = String(input.amountPaid);
    if (input.paymentDate !== undefined) {
      collection.payment_date = input.paymentDate != null ? this.toDateOnly(input.paymentDate) : null;
    }
    if (input.notes !== undefined) collection.notes = input.notes;

    // Only auto-derive status when the caller didn't explicitly set one AND
    // touched one of the two amounts — an explicit status always wins.
    if (input.status !== undefined) {
      collection.status = input.status;
    } else if (input.amountDue !== undefined || input.amountPaid !== undefined) {
      collection.status = this.deriveStatus(Number(collection.amount_due), Number(collection.amount_paid));
    }

    return repo.save(collection);
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const collection = await this.findById(societyId, id);
    await this.dataSource.getRepository(EventCollection).softDelete(collection.id);
  }

  /** pending: nothing paid yet. partial: something but not all. paid: amountPaid >= amountDue. */
  private deriveStatus(amountDue: number, amountPaid: number): EventCollectionStatus {
    if (amountPaid <= 0) return EventCollectionStatus.PENDING;
    if (amountPaid < amountDue) return EventCollectionStatus.PARTIAL;
    return EventCollectionStatus.PAID;
  }

  private toDateOnly(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  }
}
