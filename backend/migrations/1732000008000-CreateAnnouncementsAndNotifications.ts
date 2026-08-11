import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateAnnouncementsAndNotifications1732000008000 implements MigrationInterface {
  name = 'CreateAnnouncementsAndNotifications1732000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`announcements\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`title\` VARCHAR(200) NOT NULL,
        \`body\` TEXT NOT NULL,
        \`priority\` ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
        \`sent_at\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_announcements_society\` (\`society_id\`),
        INDEX \`IDX_announcements_priority\` (\`priority\`),
        INDEX \`IDX_announcements_created_at\` (\`created_at\`),
        CONSTRAINT \`FK_announcements_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`announcement_targets\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`announcement_id\` INT NOT NULL,
        \`role_id\` INT NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_announcement_targets_announcement\` (\`announcement_id\`),
        INDEX \`IDX_announcement_targets_role\` (\`role_id\`),
        UNIQUE INDEX \`UQ_announcement_targets_announcement_role\` (\`announcement_id\`, \`role_id\`),
        CONSTRAINT \`FK_announcement_targets_announcement\` FOREIGN KEY (\`announcement_id\`) REFERENCES \`announcements\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_announcement_targets_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE \`notifications\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`society_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`type\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(200) NOT NULL,
        \`body\` TEXT NULL,
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`channel\` ENUM('push','sms','email','in_app') NOT NULL DEFAULT 'in_app',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_notifications_society\` (\`society_id\`),
        INDEX \`IDX_notifications_user\` (\`user_id\`),
        INDEX \`IDX_notifications_user_is_read\` (\`user_id\`, \`is_read\`),
        INDEX \`IDX_notifications_society_user_is_read\` (\`society_id\`, \`user_id\`, \`is_read\`),
        CONSTRAINT \`FK_notifications_society\` FOREIGN KEY (\`society_id\`) REFERENCES \`societies\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_notifications_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`notifications\`;`);
    await queryRunner.query(`DROP TABLE \`announcement_targets\`;`);
    await queryRunner.query(`DROP TABLE \`announcements\`;`);
  }
}
