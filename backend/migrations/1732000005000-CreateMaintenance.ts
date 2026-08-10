import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateMaintenance1732000005000 implements MigrationInterface {
  name = 'CreateMaintenance1732000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`maintenance_bills\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`flat_id\` INT NOT NULL,
        \`billing_year\` INT NOT NULL,
        \`billing_month\` SMALLINT NOT NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`due_date\` DATE NOT NULL,
        \`status\` ENUM('due','paid','overdue','approved') NOT NULL DEFAULT 'due',
        \`paid_at\` TIMESTAMP NULL,
        \`penalty\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_bills_society_flat_year_month\` (\`society_id\`, \`flat_id\`, \`billing_year\`, \`billing_month\`),
        INDEX \`IDX_bills_society_year_month\` (\`society_id\`, \`billing_year\`, \`billing_month\`),
        INDEX \`IDX_bills_society_flat\` (\`society_id\`, \`flat_id\`),
        INDEX \`IDX_bills_society_status\` (\`society_id\`, \`status\`),
        CONSTRAINT \`FK_bills_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_bills_flat\` FOREIGN KEY (\`flat_id\`) REFERENCES \`flats\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`maintenance_payments\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`maintenance_bill_id\` INT NOT NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`payment_date\` DATE NOT NULL,
        \`payment_method\` ENUM('cash','cheque','upi','bank_transfer','card','other') NOT NULL,
        \`transaction_id\` VARCHAR(150) NULL,
        \`status\` ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'success',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_payments_society\` (\`society_id\`),
        INDEX \`IDX_payments_bill\` (\`maintenance_bill_id\`),
        INDEX \`IDX_payments_transaction_id\` (\`transaction_id\`),
        CONSTRAINT \`FK_payments_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_payments_bill\` FOREIGN KEY (\`maintenance_bill_id\`) REFERENCES \`maintenance_bills\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`maintenance_payments\`;`);
    await queryRunner.query(`DROP TABLE \`maintenance_bills\`;`);
  }
}
