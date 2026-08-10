import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateFlats1732000002000 implements MigrationInterface {
  name = 'CreateFlats1732000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`flats\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`block\` VARCHAR(50) NOT NULL,
        \`floor\` VARCHAR(20) NOT NULL,
        \`unit_no\` VARCHAR(20) NOT NULL,
        \`owner_id\` INT NULL,
        \`sqft\` DECIMAL(10,2) NOT NULL DEFAULT 0,
        \`price_per_sqft\` DECIMAL(10,2) NULL,
        \`fix_price\` DECIMAL(10,2) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_flats_society_id\` (\`society_id\`),
        INDEX \`IDX_flats_owner_id\` (\`owner_id\`),
        UNIQUE INDEX \`UQ_flats_society_block_unit\` (\`society_id\`, \`block\`, \`unit_no\`),
        CONSTRAINT \`FK_flats_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`flats\`;`);
  }
}
