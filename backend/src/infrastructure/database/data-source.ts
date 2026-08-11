import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {config} from '../../config/env.config';
import {
  Society,
  User,
  Flat,
  Role,
  Permission,
  UserRole,
  RolePermission,
  MaintenanceBill,
  MaintenancePayment,
  RefreshToken,
  AuditLog,
  HallBooking,
  Expense,
  Announcement,
  AnnouncementTarget,
  Notification,
} from '../../domain/entities';

/**
 * `synchronize` is hard-pinned to false regardless of env input — schema
 * changes must always go through a reviewed migration file. This is
 * intentionally not driven by config.db.synchronize to remove any chance
 * of an accidental production auto-sync.
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: false,
  logging: config.db.logging,
  poolSize: config.db.poolSize,
  entities: [
    Society,
    User,
    Flat,
    Role,
    Permission,
    UserRole,
    RolePermission,
    MaintenanceBill,
    MaintenancePayment,
    RefreshToken,
    AuditLog,
    HallBooking,
    Expense,
    Announcement,
    AnnouncementTarget,
    Notification,
  ],
  migrations: [__dirname + '/../../../migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
  charset: 'utf8mb4',
  timezone: 'Z',
});

let initialized = false;

export async function getDataSource(): Promise<DataSource> {
  if (!initialized) {
    await AppDataSource.initialize();
    initialized = true;
  }
  return AppDataSource;
}
