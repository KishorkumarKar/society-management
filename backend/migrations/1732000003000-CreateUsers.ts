import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateUsers1732000003000 implements MigrationInterface {
  name = 'CreateUsers1732000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`flat_id\` INT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(150) NULL,
        \`phone\` VARCHAR(20) NULL,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_users_society_id\` (\`society_id\`),
        INDEX \`IDX_users_flat_id\` (\`flat_id\`),
        INDEX \`IDX_users_email\` (\`email\`),
        INDEX \`IDX_users_phone\` (\`phone\`),
        UNIQUE INDEX \`UQ_users_society_email\` (\`society_id\`, \`email\`),
        UNIQUE INDEX \`UQ_users_society_phone\` (\`society_id\`, \`phone\`),
        CONSTRAINT \`FK_users_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_users_flat\` FOREIGN KEY (\`flat_id\`) REFERENCES \`flats\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // flats.owner_id can now reference users(id) — added after users exists
    // to avoid a circular create-table dependency.
    await queryRunner.query(`
      ALTER TABLE \`flats\`
      ADD CONSTRAINT \`FK_flats_owner\` FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`flats\` DROP FOREIGN KEY \`FK_flats_owner\`;`);
    await queryRunner.query(`DROP TABLE \`users\`;`);
  }
}
