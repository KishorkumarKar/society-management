import {DataSource} from 'typeorm';
import {EventExpense} from '../../domain/entities/event-expense.entity';
import {EventsService} from '../events/events.service';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateEventExpenseInput {
  eventId: number;
  title: string;
  category: string;
  amount: number;
  date: string | Date;
  paidTo?: string | null;
  notes?: string | null;
}

export interface UpdateEventExpenseInput {
  title?: string;
  category?: string;
  amount?: number;
  date?: string | Date;
  paidTo?: string | null;
  notes?: string | null;
}

// The public API field is `date` (per spec) but the DB/entity column is
// `expense_date` (avoids the reserved-sounding bare `date` as a column
// name, consistent with hall-bookings' start_datetime/end_datetime naming).
const SORT_FIELD_MAP: Record<string, string> = {
  date: 'expense_date',
  created_at: 'created_at',
};

export class EventExpensesService {
  constructor(
    private dataSource: DataSource,
    private eventsService: EventsService,
  ) {}

  async create(societyId: number, actorUserId: number, input: CreateEventExpenseInput): Promise<EventExpense> {
    await this.eventsService.assertBelongsToSociety(societyId, input.eventId);

    const repo = this.dataSource.getRepository(EventExpense);
    const expense = repo.create({
      society_id: societyId,
      event_id: input.eventId,
      title: input.title,
      category: input.category,
      amount: String(input.amount),
      expense_date: this.toDateOnly(input.date),
      paid_to: input.paidTo ?? null,
      notes: input.notes ?? null,
    });
    const saved = await repo.save(expense);

    logger.info('Event expense created', {actorUserId, societyId, eventId: input.eventId, expenseId: saved.id});
    return saved;
  }

  async findById(societyId: number, id: number): Promise<EventExpense> {
    const repo = this.dataSource.getRepository(EventExpense);
    const expense = await repo.findOne({where: {id, society_id: societyId}});
    if (!expense) throw ApiError.notFound('Event expense not found');
    return expense;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {
      search?: string;
      eventId?: number;
      category?: string;
      fromDate?: string | Date;
      toDate?: string | Date;
      sort: string;
    },
  ): Promise<{data: EventExpense[]; total: number}> {
    const repo = this.dataSource.getRepository(EventExpense);
    const qb = repo.createQueryBuilder('expense').where('expense.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(expense.title LIKE :search OR expense.category LIKE :search OR expense.paid_to LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.eventId) qb.andWhere('expense.event_id = :eventId', {eventId: filters.eventId});
    if (filters.category) qb.andWhere('expense.category = :category', {category: filters.category});
    if (filters.fromDate) qb.andWhere('expense.expense_date >= :fromDate', {fromDate: this.toDateOnly(filters.fromDate)});
    if (filters.toDate) qb.andWhere('expense.expense_date <= :toDate', {toDate: this.toDateOnly(filters.toDate)});

    const rawSort = filters.sort.startsWith('-') ? filters.sort.slice(1) : filters.sort;
    const sortDir = filters.sort.startsWith('-') ? ('DESC' as const) : ('ASC' as const);
    const sortField = SORT_FIELD_MAP[rawSort] ?? 'expense_date';
    qb.orderBy(`expense.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  /** eventId is deliberately not editable here — move an expense to a different event by deleting/recreating it. */
  async update(societyId: number, id: number, input: UpdateEventExpenseInput): Promise<EventExpense> {
    const expense = await this.findById(societyId, id);
    const repo = this.dataSource.getRepository(EventExpense);

    if (input.title !== undefined) expense.title = input.title;
    if (input.category !== undefined) expense.category = input.category;
    if (input.amount !== undefined) expense.amount = String(input.amount);
    if (input.date !== undefined) expense.expense_date = this.toDateOnly(input.date);
    if (input.paidTo !== undefined) expense.paid_to = input.paidTo;
    if (input.notes !== undefined) expense.notes = input.notes;

    return repo.save(expense);
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const expense = await this.findById(societyId, id);
    await this.dataSource.getRepository(EventExpense).softDelete(expense.id);
  }

  private toDateOnly(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  }
}
