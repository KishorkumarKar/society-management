import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {AppDataSource} from '../../src/infrastructure/database/data-source';

/**
 * Tests run against a REAL MySQL database (see .env / TEST_DB_DATABASE),
 * migrated fresh, rather than a mocked ORM — tenant isolation and unique
 * constraints are exactly the kind of behavior that's easy to fake past
 * with mocks and needs a real database to actually prove.
 *
 * Requires a reachable MySQL instance; `docker-compose up -d mysql` is the
 * easiest way to satisfy that locally (see docker-compose.yml).
 */
export async function initTestDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();
  return AppDataSource;
}

export async function clearAllTables(dataSource: DataSource): Promise<void> {
  const tables = [
    'notifications',
    'announcement_targets',
    'announcements',
    'expenses',
    'hall_bookings',
    'audit_logs',
    'refresh_tokens',
    'maintenance_payments',
    'maintenance_bills',
    'role_permissions',
    'user_roles',
    'permissions',
    'roles',
    'users',
    'flats',
    'societies',
  ];
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    await dataSource.query(`TRUNCATE TABLE \`${table}\``);
  }
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function closeTestDataSource(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
