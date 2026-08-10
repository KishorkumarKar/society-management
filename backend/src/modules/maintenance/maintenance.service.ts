import {DataSource} from 'typeorm';
import {MaintenanceBill, MaintenanceBillStatus} from '../../domain/entities/maintenance-bill.entity';
import {MaintenancePayment, PaymentStatus} from '../../domain/entities/maintenance-payment.entity';
import {Flat} from '../../domain/entities/flat.entity';
import {ApiError} from '../../utils/api-response';
import {PaginationQuery} from '../../utils/pagination';
import {logger} from '../../infrastructure/logging/logger';

export interface CreateBillInput {
  flatId: number;
  billingYear: number;
  billingMonth: number;
  amount: number;
  dueDate: string | Date;
  penalty?: number;
}

export interface UpdateBillInput {
  amount?: number;
  dueDate?: string | Date;
  status?: MaintenanceBillStatus;
  penalty?: number;
}

export interface CreatePaymentInput {
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
  transactionId?: string | null;
}

export interface BillWithOutstanding {
  bill: MaintenanceBill;
  totalPaid: number;
  outstanding: number;
}

export class MaintenanceService {
  constructor(private dataSource: DataSource) {}

  /**
   * Bill uniqueness (society + flat + year + month) is enforced by both the
   * DB unique index and this pre-check, so the error the client sees is a
   * clean 409 rather than a raw DB constraint message.
   */
  async createBill(societyId: number, input: CreateBillInput): Promise<MaintenanceBill> {
    const flat = await this.dataSource.getRepository(Flat).findOne({where: {id: input.flatId}});
    if (!flat) throw ApiError.badRequest('Flat not found', 'FLAT_NOT_FOUND');
    if (flat.society_id !== societyId) {
      throw ApiError.forbidden('Flat belongs to a different society', 'FLAT_SOCIETY_MISMATCH');
    }

    const repo = this.dataSource.getRepository(MaintenanceBill);
    const existing = await repo.findOne({
      where: {
        society_id: societyId,
        flat_id: input.flatId,
        billing_year: input.billingYear,
        billing_month: input.billingMonth,
      },
    });
    if (existing) {
      throw ApiError.conflict(
        'A bill already exists for this flat, billing year, and billing month',
        'BILL_DUPLICATE',
      );
    }

    const bill = repo.create({
      society_id: societyId,
      flat_id: input.flatId,
      billing_year: input.billingYear,
      billing_month: input.billingMonth,
      amount: String(input.amount),
      due_date: this.toDateOnly(input.dueDate),
      penalty: String(input.penalty ?? 0),
      status: MaintenanceBillStatus.DUE,
    });

    return repo.save(bill);
  }

  async findById(societyId: number, id: number): Promise<MaintenanceBill> {
    const repo = this.dataSource.getRepository(MaintenanceBill);
    const bill = await repo.findOne({where: {id, society_id: societyId}});
    if (!bill) throw ApiError.notFound('Maintenance bill not found');
    return bill;
  }

  async getWithOutstanding(societyId: number, id: number): Promise<BillWithOutstanding> {
    const bill = await this.findById(societyId, id);
    return this.attachOutstanding(bill);
  }

  async list(
    societyId: number,
    pagination: PaginationQuery,
    filters: {flatId?: number; billingYear?: number; billingMonth?: number; status?: string; sort: string},
  ): Promise<{data: BillWithOutstanding[]; total: number}> {
    const repo = this.dataSource.getRepository(MaintenanceBill);
    const qb = repo.createQueryBuilder('bill').where('bill.society_id = :societyId', {societyId});

    if (filters.flatId) qb.andWhere('bill.flat_id = :flatId', {flatId: filters.flatId});
    if (filters.billingYear) qb.andWhere('bill.billing_year = :billingYear', {billingYear: filters.billingYear});
    if (filters.billingMonth) qb.andWhere('bill.billing_month = :billingMonth', {billingMonth: filters.billingMonth});
    if (filters.status) qb.andWhere('bill.status = :status', {status: filters.status});

    const [sortField, sortDir] = filters.sort.startsWith('-')
      ? [filters.sort.slice(1), 'DESC' as const]
      : [filters.sort, 'ASC' as const];
    qb.orderBy(`bill.${sortField}`, sortDir);
    qb.skip(pagination.skip).take(pagination.limit);

    const [bills, total] = await qb.getManyAndCount();
    const data = await Promise.all(bills.map((bill) => this.attachOutstanding(bill)));
    return {data, total};
  }

  async update(societyId: number, id: number, input: UpdateBillInput): Promise<MaintenanceBill> {
    const bill = await this.findById(societyId, id);
    const repo = this.dataSource.getRepository(MaintenanceBill);

    if (input.amount !== undefined) bill.amount = String(input.amount);
    if (input.dueDate !== undefined) bill.due_date = this.toDateOnly(input.dueDate);
    if (input.status !== undefined) bill.status = input.status;
    if (input.penalty !== undefined) bill.penalty = String(input.penalty);

    return repo.save(bill);
  }

  async softDelete(societyId: number, id: number): Promise<void> {
    const bill = await this.findById(societyId, id);
    await this.dataSource.getRepository(MaintenanceBill).softDelete(bill.id);
  }

  /**
   * Records a payment against a bill WITHOUT assuming it fully settles the
   * bill — partial payments are a first-class case. `status='paid'` is only
   * ever set once the computed outstanding amount actually reaches zero,
   * inside the same transaction as the payment insert, so the bill and its
   * payment history can never disagree about whether it's settled.
   */
  async recordPayment(societyId: number, billId: number, input: CreatePaymentInput): Promise<MaintenancePayment> {
    return this.dataSource.transaction(async (manager) => {
      const billRepo = manager.getRepository(MaintenanceBill);
      const bill = await billRepo.findOne({where: {id: billId, society_id: societyId}});
      if (!bill) throw ApiError.notFound('Maintenance bill not found');

      const paymentRepo = manager.getRepository(MaintenancePayment);
      const payment = paymentRepo.create({
        society_id: societyId,
        maintenance_bill_id: billId,
        amount: String(input.amount),
        payment_date: this.toDateOnly(input.paymentDate),
        payment_method: input.paymentMethod as MaintenancePayment['payment_method'],
        transaction_id: input.transactionId ?? null,
        status: PaymentStatus.SUCCESS,
      });
      const savedPayment = await paymentRepo.save(payment);

      const totalPaidRow = await manager
        .createQueryBuilder(MaintenancePayment, 'p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.maintenance_bill_id = :billId', {billId})
        .andWhere('p.status = :status', {status: PaymentStatus.SUCCESS})
        .getRawOne<{total: string}>();

      const totalPaid = Number(totalPaidRow?.total ?? 0);
      const outstanding = Number(bill.amount) + Number(bill.penalty) - totalPaid;

      if (outstanding <= 0 && bill.status !== MaintenanceBillStatus.APPROVED) {
        bill.status = MaintenanceBillStatus.PAID;
        bill.paid_at = new Date();
        await billRepo.save(bill);
      }

      logger.info('Maintenance payment recorded', {societyId, billId, amount: input.amount, outstanding});
      return savedPayment;
    });
  }

  async listPayments(societyId: number, billId: number): Promise<MaintenancePayment[]> {
    await this.findById(societyId, billId); // tenant + existence check
    return this.dataSource
      .getRepository(MaintenancePayment)
      .find({where: {maintenance_bill_id: billId, society_id: societyId}, order: {payment_date: 'ASC'}});
  }

  private async attachOutstanding(bill: MaintenanceBill): Promise<BillWithOutstanding> {
    const totalPaidRow = await this.dataSource
      .createQueryBuilder(MaintenancePayment, 'p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.maintenance_bill_id = :billId', {billId: bill.id})
      .andWhere('p.status = :status', {status: PaymentStatus.SUCCESS})
      .getRawOne<{total: string}>();

    const totalPaid = Number(totalPaidRow?.total ?? 0);
    const outstanding = Math.max(0, Number(bill.amount) + Number(bill.penalty) - totalPaid);

    return {bill, totalPaid, outstanding};
  }

  private toDateOnly(value: string | Date): string {
    const d = value instanceof Date ? value : new Date(value);
    return d.toISOString().slice(0, 10);
  }
}
