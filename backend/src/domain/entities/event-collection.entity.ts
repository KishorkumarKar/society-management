import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {Society} from './society.entity';
import {Event} from './event.entity';

export enum EventCollectionStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
}

/**
 * A single member's contribution toward one event's target_amount. Kept as
 * its own table (not columns on Event) since an event has many
 * contributors — mirrors how maintenance bills/payments are split rather
 * than folded into Flat.
 *
 * `member_name` / `unit` are stored as plain text rather than FKs to
 * `users`/`flats`: event collections often cover guests, tenants, or
 * one-off contributors who may not have a user/flat record in the system,
 * matching the shape requested (memberName/unit as free text).
 */
@Entity('event_collections')
@Index(['society_id'])
@Index(['event_id'])
@Index(['society_id', 'event_id'])
export class EventCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int'})
  event_id: number;

  @ManyToOne(() => Event, (event) => event.collections, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'event_id'})
  event: Event;

  @Column({type: 'varchar', length: 150})
  member_name: string;

  @Column({type: 'varchar', length: 50})
  unit: string;

  @Column({type: 'decimal', precision: 12, scale: 2})
  amount_due: string;

  @Column({type: 'decimal', precision: 12, scale: 2, default: 0})
  amount_paid: string;

  @Column({type: 'date', nullable: true})
  payment_date: string | null;

  @Column({type: 'enum', enum: EventCollectionStatus, default: EventCollectionStatus.PENDING})
  status: EventCollectionStatus;

  @Column({type: 'text', nullable: true})
  notes: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;
}
