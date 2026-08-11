import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateHallBookingsAndExpenses1732000007000 implements MigrationInterface {
  name = 'CreateHallBookingsAndExpenses1732000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`hall_bookings\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`flat_id\` INT NOT NULL,
        \`hall_name\` VARCHAR(100) NOT NULL,
        \`booking_date\` DATE NOT NULL,
        \`time_slot\` VARCHAR(50) NOT NULL,
        \`purpose\` VARCHAR(255) NULL,
        \`status\` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
        \`amount\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`deposit\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_hall_bookings_society\` (\`society_id\`),
        INDEX \`IDX_hall_bookings_society_date\` (\`society_id\`, \`booking_date\`),
        INDEX \`IDX_hall_bookings_society_hall_date\` (\`society_id\`, \`hall_name\`, \`booking_date\`),
        INDEX \`IDX_hall_bookings_flat\` (\`flat_id\`),
        INDEX \`IDX_hall_bookings_status\` (\`status\`),
        CONSTRAINT \`FK_hall_bookings_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_hall_bookings_flat\` FOREIGN KEY (\`flat_id\`) REFERENCES \`flats\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`expenses\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`vendor_name\` VARCHAR(150) NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`expense_date\` DATE NOT NULL,
        \`approved_by\` INT NULL,
        \`approved_at\` TIMESTAMP NULL,
        \`status\` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        \`receipt_url\` VARCHAR(500) NULL,
        \`description\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_expenses_society\` (\`society_id\`),
        INDEX \`IDX_expenses_society_date\` (\`society_id\`, \`expense_date\`),
        INDEX \`IDX_expenses_society_category\` (\`society_id\`, \`category\`),
        INDEX \`IDX_expenses_approved_by\` (\`approved_by\`),
        CONSTRAINT \`FK_expenses_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_expenses_approved_by\` FOREIGN KEY (\`approved_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`expenses\`;`);
    await queryRunner.query(`DROP TABLE \`hall_bookings\`;`);
  }
}
