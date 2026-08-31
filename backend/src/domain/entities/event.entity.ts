import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {Society} from './society.entity';
import {User} from './user.entity';
import {EventCollection} from './event-collection.entity';
import {EventExpense} from './event-expense.entity';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * A society-organized event (Halloween Bash, Diwali Mela, etc). Financial
 * activity tied to the event — member contributions and event-specific
 * spend — lives in the separate `event_collections` / `event_expenses`
 * tables (see those entities), NOT in this one and NOT mixed into the
 * society-wide `expenses` table: an event's budget is its own ledger,
 * scoped by event_id, distinct from general society expenses.
 */
@Entity('events')
@Index(['society_id'])
@Index(['society_id', 'event_date'])
@Index(['status'])
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'varchar', length: 200})
  name: string;

  @Column({type: 'text', nullable: true})
  description: string | null;

  @Column({type: 'date'})
  event_date: string;

  @Column({type: 'enum', enum: EventStatus, default: EventStatus.UPCOMING})
  status: EventStatus;

  @Column({type: 'decimal', precision: 12, scale: 2, default: 0})
  target_amount: string;

  /**
   * ALWAYS derived from the authenticated actor at creation time, never
   * accepted from the request body — same rule as approved_by elsewhere in
   * this codebase (see ExpensesService.approve). The controller never
   * parses a createdBy field out of the body.
   */
  @Column({type: 'int'})
  created_by: number;

  @ManyToOne(() => User, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'created_by'})
  creator: User;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => EventCollection, (collection) => collection.event)
  collections: EventCollection[];

  @OneToMany(() => EventExpense, (expense) => expense.event)
  expenses: EventExpense[];
}
