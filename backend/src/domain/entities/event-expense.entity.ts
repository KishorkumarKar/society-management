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

/**
 * Spend tied to a specific event's budget — separate from the society-wide
 * `expenses` table (recurring society operating costs, with its own
 * approval workflow). Event expenses have no approval workflow of their
 * own per spec: whoever holds `event_expenses.create/update` can record
 * them directly, same as EventCollection.
 */
@Entity('event_expenses')
@Index(['society_id'])
@Index(['event_id'])
@Index(['society_id', 'event_id'])
export class EventExpense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int'})
  event_id: number;

  @ManyToOne(() => Event, (event) => event.expenses, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'event_id'})
  event: Event;

  @Column({type: 'varchar', length: 200})
  title: string;

  @Column({type: 'varchar', length: 100})
  category: string;

  @Column({type: 'decimal', precision: 12, scale: 2})
  amount: string;

  @Column({type: 'date'})
  expense_date: string;

  @Column({type: 'varchar', length: 150, nullable: true})
  paid_to: string | null;

  @Column({type: 'text', nullable: true})
  notes: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;
}
