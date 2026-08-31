import {MigrationInterface, QueryRunner} from 'typeorm';

/**
 * Replaces the old `booking_date` (DATE) + `time_slot` (free-text VARCHAR)
 * pair on `hall_bookings` with a proper `start_datetime` / `end_datetime`
 * range. The free-text time_slot ("10:00-13:00") could not be queried or
 * validated as a real range (no overlap checks, no cross-midnight support);
 * two real datetime columns can be.
 *
 * `time_slot` is parsed as best-effort ("HH:mm-HH:mm") combined with
 * `booking_date` to backfill `start_datetime`/`end_datetime` for existing
 * rows, so no booking history is lost. Rows where parsing fails fall back
 * to the full day (00:00-23:59:59) so nothing is silently dropped; these
 * should be spot-checked after migrating a production dataset.
 */
export class AlterHallBookingsToDateTimeRange1732000009000 implements MigrationInterface {
  name = 'AlterHallBookingsToDateTimeRange1732000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`hall_bookings\`
        ADD COLUMN \`start_datetime\` DATETIME NULL AFTER \`hall_name\`,
        ADD COLUMN \`end_datetime\` DATETIME NULL AFTER \`start_datetime\`;
    `);

    // Best-effort backfill from booking_date + time_slot ("HH:mm-HH:mm").
    await queryRunner.query(`
      UPDATE \`hall_bookings\`
      SET
        \`start_datetime\` = CASE
          WHEN \`time_slot\` REGEXP '^[0-9]{1,2}:[0-9]{2}-[0-9]{1,2}:[0-9]{2}$'
            THEN TIMESTAMP(\`booking_date\`, CONCAT(SUBSTRING_INDEX(\`time_slot\`, '-', 1), ':00'))
          ELSE TIMESTAMP(\`booking_date\`, '00:00:00')
        END,
        \`end_datetime\` = CASE
          WHEN \`time_slot\` REGEXP '^[0-9]{1,2}:[0-9]{2}-[0-9]{1,2}:[0-9]{2}$'
            THEN TIMESTAMP(\`booking_date\`, CONCAT(SUBSTRING_INDEX(\`time_slot\`, '-', -1), ':00'))
          ELSE TIMESTAMP(\`booking_date\`, '23:59:59')
        END;
    `);

    await queryRunner.query(`
      ALTER TABLE \`hall_bookings\`
        MODIFY COLUMN \`start_datetime\` DATETIME NOT NULL,
        MODIFY COLUMN \`end_datetime\` DATETIME NOT NULL;
    `);

    await queryRunner.query(`DROP INDEX \`IDX_hall_bookings_society_date\` ON \`hall_bookings\`;`);
    await queryRunner.query(`DROP INDEX \`IDX_hall_bookings_society_hall_date\` ON \`hall_bookings\`;`);

    await queryRunner.query(`
      ALTER TABLE \`hall_bookings\`
        DROP COLUMN \`booking_date\`,
        DROP COLUMN \`time_slot\`;
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_hall_bookings_society_start\` ON \`hall_bookings\` (\`society_id\`, \`start_datetime\`);
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_hall_bookings_society_hall_range\`
        ON \`hall_bookings\` (\`society_id\`, \`hall_name\`, \`start_datetime\`, \`end_datetime\`);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`hall_bookings\`
        ADD COLUMN \`booking_date\` DATE NULL AFTER \`hall_name\`,
        ADD COLUMN \`time_slot\` VARCHAR(50) NULL AFTER \`booking_date\`;
    `);

    await queryRunner.query(`
      UPDATE \`hall_bookings\`
      SET
        \`booking_date\` = DATE(\`start_datetime\`),
        \`time_slot\` = CONCAT(TIME_FORMAT(\`start_datetime\`, '%H:%i'), '-', TIME_FORMAT(\`end_datetime\`, '%H:%i'));
    `);

    await queryRunner.query(`
      ALTER TABLE \`hall_bookings\`
        MODIFY COLUMN \`booking_date\` DATE NOT NULL,
        MODIFY COLUMN \`time_slot\` VARCHAR(50) NOT NULL;
    `);

    await queryRunner.query(`DROP INDEX \`IDX_hall_bookings_society_start\` ON \`hall_bookings\`;`);
    await queryRunner.query(`DROP INDEX \`IDX_hall_bookings_society_hall_range\` ON \`hall_bookings\`;`);

    await queryRunner.query(`
      ALTER TABLE \`hall_bookings\`
        DROP COLUMN \`start_datetime\`,
        DROP COLUMN \`end_datetime\`;
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_hall_bookings_society_date\` ON \`hall_bookings\` (\`society_id\`, \`booking_date\`);
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_hall_bookings_society_hall_date\`
        ON \`hall_bookings\` (\`society_id\`, \`hall_name\`, \`booking_date\`);
    `);
  }
}
