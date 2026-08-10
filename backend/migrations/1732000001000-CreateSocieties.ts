import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateSocieties1732000001000 implements MigrationInterface {
  name = 'CreateSocieties1732000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`societies\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(150) NOT NULL,
        \`city\` VARCHAR(100) NOT NULL,
        \`address\` TEXT NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL,
        \`user_limit\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`registration_no\` VARCHAR(100) NULL,
        \`status\` TINYINT NOT NULL DEFAULT 1,
        \`rate_type\` ENUM('PER_SQFT','FIXED') NOT NULL DEFAULT 'PER_SQFT',
        \`rate_per_sqft\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_societies_slug\` (\`slug\`),
        UNIQUE INDEX \`UQ_societies_registration_no\` (\`registration_no\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`societies\`;`);
  }
}
