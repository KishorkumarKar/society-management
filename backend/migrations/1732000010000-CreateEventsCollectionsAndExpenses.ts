import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * Events, plus their two child ledgers: per-member collections and
 * event-scoped expenses. Both child tables carry `society_id` directly
 * (denormalized, same convention as every other tenant-scoped table here)
 * rather than requiring a join through `events` for tenant checks, and
 * `event_id` cascades on delete since a collection/expense row has no
 * independent meaning once its parent event is gone (events themselves are
 * soft-deleted via `deleted_at`, so this CASCADE only fires on a real hard
 * delete, which this app never performs through the API).
 */
export class CreateEventsCollectionsAndExpenses1732000010000 implements MigrationInterface {
  name = 'CreateEventsCollectionsAndExpenses1732000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`events\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`name\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NULL,
        \`event_date\` DATE NOT NULL,
        \`status\` ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
        \`target_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0,
        \`created_by\` INT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_events_society\` (\`society_id\`),
        INDEX \`IDX_events_society_date\` (\`society_id\`, \`event_date\`),
        INDEX \`IDX_events_status\` (\`status\`),
        CONSTRAINT \`FK_events_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_events_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`event_collections\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`event_id\` INT NOT NULL,
        \`member_name\` VARCHAR(150) NOT NULL,
        \`unit\` VARCHAR(50) NOT NULL,
        \`amount_due\` DECIMAL(12,2) NOT NULL,
        \`amount_paid\` DECIMAL(12,2) NOT NULL DEFAULT 0,
        \`payment_date\` DATE NULL,
        \`status\` ENUM('pending','partial','paid') NOT NULL DEFAULT 'pending',
        \`notes\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_event_collections_society\` (\`society_id\`),
        INDEX \`IDX_event_collections_event\` (\`event_id\`),
        INDEX \`IDX_event_collections_society_event\` (\`society_id\`, \`event_id\`),
        CONSTRAINT \`FK_event_collections_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_event_collections_event\` FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`event_expenses\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`event_id\` INT NOT NULL,
        \`title\` VARCHAR(200) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`amount\` DECIMAL(12,2) NOT NULL,
        \`expense_date\` DATE NOT NULL,
        \`paid_to\` VARCHAR(150) NULL,
        \`notes\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_event_expenses_society\` (\`society_id\`),
        INDEX \`IDX_event_expenses_event\` (\`event_id\`),
        INDEX \`IDX_event_expenses_society_event\` (\`society_id\`, \`event_id\`),
        CONSTRAINT \`FK_event_expenses_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_event_expenses_event\` FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`event_expenses\`;`);
    await queryRunner.query(`DROP TABLE \`event_collections\`;`);
    await queryRunner.query(`DROP TABLE \`events\`;`);
  }
}
