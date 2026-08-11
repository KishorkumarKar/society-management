import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {seedPermissions, createSociety, createRoleWithPermissions, createUserWithRole} from '../test-utils/fixtures';
import {ExpensesService} from '../../src/modules/expenses/expenses.service';
import {ExpenseStatus} from '../../src/domain/entities/expense.entity';
import {Permission} from '../../src/domain/entities/permission.entity';

describe('ExpensesService', () => {
  let dataSource: DataSource;
  let expensesService: ExpensesService;
  let permissionsByName: Map<string, Permission>;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    expensesService = new ExpensesService(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
    permissionsByName = await seedPermissions(dataSource);
  });

  // approved_by is a real FK to users(id), so every "approver" in these
  // tests must be an actual persisted user, not an arbitrary id.
  async function makeApprover(societyId: number) {
    const role = await createRoleWithPermissions(dataSource, societyId, 'Treasurer', [], permissionsByName);
    return createUserWithRole(dataSource, societyId, role.id);
  }

  it('creates a pending expense scoped to the caller society', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});

    const expense = await expensesService.create(society.id, 1, {
      category: 'maintenance',
      amount: 500,
      expenseDate: '2026-08-01',
    });

    expect(expense.status).toBe(ExpenseStatus.PENDING);
    expect(expense.society_id).toBe(society.id);
    expect(expense.approved_by).toBeNull();
  });

  it('sets approved_by to the ACTOR user id, never a client-supplied value', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const approver = await makeApprover(society.id);
    const expense = await expensesService.create(society.id, 1, {category: 'repairs', amount: 800, expenseDate: '2026-08-01'});

    const approved = await expensesService.approve(society.id, expense.id, approver.id, 'approved');

    expect(approved.status).toBe(ExpenseStatus.APPROVED);
    expect(approved.approved_by).toBe(approver.id);
    expect(approved.approved_at).not.toBeNull();
  });

  it('can reject a pending expense', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const approver = await makeApprover(society.id);
    const expense = await expensesService.create(society.id, 1, {category: 'utilities', amount: 300, expenseDate: '2026-08-01'});

    const rejected = await expensesService.approve(society.id, expense.id, approver.id, 'rejected');
    expect(rejected.status).toBe(ExpenseStatus.REJECTED);
    expect(rejected.approved_by).toBe(approver.id);
  });

  it('rejects approving an expense that is not pending (invalid approval)', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const approver = await makeApprover(society.id);
    const expense = await expensesService.create(society.id, 1, {category: 'security', amount: 400, expenseDate: '2026-08-01'});
    await expensesService.approve(society.id, expense.id, approver.id, 'approved');

    await expect(expensesService.approve(society.id, expense.id, approver.id, 'approved')).rejects.toMatchObject({
      code: 'EXPENSE_NOT_PENDING',
    });
  });

  it('rejects editing an expense once it has left the pending state', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const approver = await makeApprover(society.id);
    const expense = await expensesService.create(society.id, 1, {category: 'security', amount: 400, expenseDate: '2026-08-01'});
    await expensesService.approve(society.id, expense.id, approver.id, 'approved');

    await expect(expensesService.update(society.id, expense.id, {amount: 999})).rejects.toMatchObject({
      code: 'EXPENSE_NOT_EDITABLE',
    });
  });

  it('an expense fetched by id must belong to the querying society', async () => {
    const societyA = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const societyB = await createSociety(dataSource, {name: 'Society B', slug: 'society-b'});
    const expense = await expensesService.create(societyA.id, 1, {category: 'maintenance', amount: 500, expenseDate: '2026-08-01'});

    await expect(expensesService.findById(societyB.id, expense.id)).rejects.toMatchObject({statusCode: 404});
  });

  it('soft-deletes rather than physically deleting (financial record retention)', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const expense = await expensesService.create(society.id, 1, {category: 'maintenance', amount: 500, expenseDate: '2026-08-01'});

    await expensesService.softDelete(society.id, expense.id);

    const raw = await dataSource.query('SELECT deleted_at FROM expenses WHERE id = ?', [expense.id]);
    expect(raw[0].deleted_at).not.toBeNull();
    await expect(expensesService.findById(society.id, expense.id)).rejects.toMatchObject({statusCode: 404});
  });
});
