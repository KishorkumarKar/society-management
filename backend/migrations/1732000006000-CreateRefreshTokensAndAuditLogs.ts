import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateRefreshTokensAndAuditLogs1732000006000 implements MigrationInterface {
  name = 'CreateRefreshTokensAndAuditLogs1732000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`society_id\` INT NOT NULL,
        \`token_hash\` VARCHAR(255) NOT NULL,
        \`expires_at\` TIMESTAMP NOT NULL,
        \`revoked_at\` TIMESTAMP NULL,
        \`replaced_by_token_id\` INT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_refresh_tokens_user\` (\`user_id\`),
        UNIQUE INDEX \`UQ_refresh_tokens_hash\` (\`token_hash\`),
        CONSTRAINT \`FK_refresh_tokens_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NULL,
        \`user_id\` INT NULL,
        \`action\` VARCHAR(100) NOT NULL,
        \`resource\` VARCHAR(100) NOT NULL,
        \`resource_id\` INT NULL,
        \`before_json\` JSON NULL,
        \`after_json\` JSON NULL,
        \`ip_address\` VARCHAR(64) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_audit_logs_society\` (\`society_id\`),
        INDEX \`IDX_audit_logs_user\` (\`user_id\`),
        INDEX \`IDX_audit_logs_resource\` (\`resource\`, \`resource_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`audit_logs\`;`);
    await queryRunner.query(`DROP TABLE \`refresh_tokens\`;`);
  }
}
