import {DataSource} from 'typeorm';
import {Expense, ExpenseStatus} from '../../domain/entities/expense.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateExpenseInput {
  category: string;
  vendorName?: string | null;
  amount: number;
  expenseDate: string | Date;
  receiptUrl?: string | null;
  description?: string | null;
}

export interface UpdateExpenseInput {
  category?: string;
  vendorName?: string | null;
  amount?: number;
  expenseDate?: string | Date;
  receiptUrl?: string | null;
  description?: string | null;
}

export class ExpensesService {
  constructor(private dataSource: DataSource) {}

  async create(societyId: number, actorUserId: number, input: CreateExpenseInput): Promise<Expense> {
    const repo = this.dataSource.getRepository(Expense);

    const expense = repo.create({
      society_id: societyId,
      category: input.category,
      vendor_name: input.vendorName ?? null,
      amount: String(input.amount),
      expense_date: this.toDateOnly(input.expenseDate),
      receipt_url: input.receiptUrl ?? null,
      description: input.description ?? null,
      status: ExpenseStatus.PENDING,
      approved_by: null,
      approved_at: null,
    });
    const saved = await repo.save(expense);

    logger.info('Expense created', {actorUserId, societyId, expenseId: saved.id, category: saved.category, amount: saved.amount});
    return saved;
  }

  async findById(societyId: number, id: number): Promise<Expense> {
    const repo = this.dataSource.getRepository(Expense);
    const expense = await repo.findOne({where: {id, society_id: societyId}});
    if (!expense) throw ApiError.notFound('Expense not found');
    return expense;
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {
      search?: string;
      category?: string;
      vendorName?: string;
      fromDate?: string | Date;
      toDate?: string | Date;
      approvedBy?: number;
      status?: string;
      sort: string;
    },
  ): Promise<{data: Expense[]; total: number}> {
    const repo = this.dataSource.getRepository(Expense);
    const qb = repo.createQueryBuilder('expense').where('expense.society_id = :societyId', {societyId});

    if (filters.search) {
      qb.andWhere('(expense.category LIKE :search OR expense.vendor_name LIKE :search OR expense.description LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.category) qb.andWhere('expense.category = :category', {category: filters.category});
    if (filters.vendorName) qb.andWhere('expense.vendor_name = :vendorName', {vendorName: filters.vendorName});
    if (filters.fromDate) qb.andWhere('expense.expense_date >= :fromDate', {fromDate: this.toDateOnly(filters.fromDate)});
    if (filters.toDate) qb.andWhere('expense.expense_date <= :toDate', {toDate: this.toDateOnly(filters.toDate)});
    if (filters.approvedBy) qb.andWhere('expense.approved_by = :approvedBy', {approvedBy: filters.approvedBy});
    if (filters.status) qb.andWhere('expense.status = :status', {status: filters.status});

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`expense.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return {data, total};
  }

  async update(societyId: number, id: number, input: UpdateExpenseInput): Promise<Expense> {
    const expense = await this.findById(societyId, id);
    if (expense.status !== ExpenseStatus.PENDING) {
      throw ApiError.conflict('Only pending expenses can be edited', 'EXPENSE_NOT_EDITABLE');
    }

    if (input.category !== undefined) expense.category = input.category;
    if (input.vendorName !== undefined) expense.vendor_name = input.vendorName;
    if (input.amount !== undefined) expense.amount = String(input.amount);
    if (input.expenseDate !== undefined) expense.expense_date = this.toDateOnly(input.expenseDate);
    if (input.receiptUrl !== undefined) expense.receipt_url = input.receiptUrl;
    if (input.description !== undefined) expense.description = input.description;

    return this.dataSource.getRepository(Expense).save(expense);
  }

  /** Never physically deletes — financial records are soft-deleted only, per spec section 21. */
  async softDelete(societyId: number, id: number): Promise<void> {
    const expense = await this.findById(societyId, id);
    await this.dataSource.getRepository(Expense).softDelete(expense.id);
  }

  /**
   * `approved_by` and `approved_at` are ALWAYS derived from the
   * authenticated actor — never accepted from the request body (spec
   * section 6: "Do not allow approved_by to be supplied arbitrarily by the
   * frontend"). The controller never even parses an approved_by field out
   * of the body for this route.
   */
  async approve(societyId: number, id: number, actorUserId: number, decision: 'approved' | 'rejected'): Promise<Expense> {
    const expense = await this.findById(societyId, id);
    if (expense.status !== ExpenseStatus.PENDING) {
      throw ApiError.conflict(`Cannot ${decision === 'approved' ? 'approve' : 'reject'} an expense that is not pending`, 'EXPENSE_NOT_PENDING');
    }

    expense.status = decision === 'approved' ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED;
    expense.approved_by = actorUserId;
    expense.approved_at = new Date();

    const saved = await this.dataSource.getRepository(Expense).save(expense);
    logger.info('Expense approval decision', {actorUserId, societyId, expenseId: id, decision});
    return saved;
  }

  private toDateOnly(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  }
}
