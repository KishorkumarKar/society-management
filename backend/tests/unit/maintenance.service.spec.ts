import {DataSource} from 'typeorm';
import {initTestDataSource, clearAllTables, closeTestDataSource} from '../test-utils/db';
import {createSociety} from '../test-utils/fixtures';
import {MaintenanceService} from '../../src/modules/maintenance/maintenance.service';
import {PaymentMethod} from '../../src/domain/entities/maintenance-payment.entity';
import {Flat} from '../../src/domain/entities/flat.entity';

describe('MaintenanceService', () => {
  let dataSource: DataSource;
  let maintenanceService: MaintenanceService;

  beforeAll(async () => {
    dataSource = await initTestDataSource();
    maintenanceService = new MaintenanceService(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearAllTables(dataSource);
  });

  async function makeFlat(societyId: number) {
    const repo = dataSource.getRepository(Flat);
    return repo.save(repo.create({society_id: societyId, block: 'A', floor: '1', unit_no: 'A-101', sqft: '1000.00'}));
  }

  it('rejects creating a duplicate bill for the same society+flat+year+month', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await makeFlat(society.id);

    await maintenanceService.createBill(society.id, {
      flatId: flat.id,
      billingYear: 2026,
      billingMonth: 8,
      amount: 4000,
      dueDate: new Date('2026-08-10'),
      penalty: 0,
    });

    await expect(
      maintenanceService.createBill(society.id, {
        flatId: flat.id,
        billingYear: 2026,
        billingMonth: 8,
        amount: 4000,
        dueDate: new Date('2026-08-10'),
        penalty: 0,
      }),
    ).rejects.toMatchObject({code: 'BILL_DUPLICATE'});
  });

  it('computes outstanding as amount + penalty - sum(successful payments), never relying on status alone', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await makeFlat(society.id);

    const bill = await maintenanceService.createBill(society.id, {
      flatId: flat.id,
      billingYear: 2026,
      billingMonth: 8,
      amount: 1000,
      dueDate: new Date('2026-08-10'),
      penalty: 100,
    });

    // Partial payment only — status remains whatever it was, but outstanding
    // must reflect the partial amount, not just flip to "paid".
    await maintenanceService.recordPayment(society.id, bill.id, {
      amount: 600,
      paymentDate: new Date('2026-08-05'),
      paymentMethod: PaymentMethod.CASH,
    });

    const withOutstanding = await maintenanceService.getWithOutstanding(society.id, bill.id);

    // 1000 + 100 - 600 = 500
    expect(withOutstanding.outstanding).toBeCloseTo(500, 2);
    expect(withOutstanding.totalPaid).toBeCloseTo(600, 2);
  });

  it('a fully paid bill (across multiple partial payments) has zero outstanding', async () => {
    const society = await createSociety(dataSource, {name: 'Society A', slug: 'society-a'});
    const flat = await makeFlat(society.id);

    const bill = await maintenanceService.createBill(society.id, {
      flatId: flat.id,
      billingYear: 2026,
      billingMonth: 9,
      amount: 1000,
      dueDate: new Date('2026-09-10'),
      penalty: 0,
    });

    await maintenanceService.recordPayment(society.id, bill.id, {
      amount: 400,
      paymentDate: new Date('2026-09-01'),
      paymentMethod: PaymentMethod.UPI,
    });
    await maintenanceService.recordPayment(society.id, bill.id, {
      amount: 600,
      paymentDate: new Date('2026-09-05'),
      paymentMethod: PaymentMethod.UPI,
    });

    const withOutstanding = await maintenanceService.getWithOutstanding(society.id, bill.id);
    expect(withOutstanding.outstanding).toBeCloseTo(0, 2);
  });
});
