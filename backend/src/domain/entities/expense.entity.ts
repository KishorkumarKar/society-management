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
import {User} from './user.entity';

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * `status` was not in the original spec table but is explicitly invited
 * ("if the existing business design supports expense approval workflows")
 * — without it, "approve" would just be a permission-gated field write with
 * no real state machine, and expenses.approve as a distinct permission from
 * expenses.update would be meaningless.
 */
@Entity('expenses')
@Index(['society_id'])
@Index(['society_id', 'expense_date'])
@Index(['society_id', 'category'])
@Index(['approved_by'])
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'varchar', length: 100})
  category: string;

  @Column({type: 'varchar', length: 150, nullable: true})
  vendor_name: string | null;

  @Column({type: 'decimal', precision: 10, scale: 2})
  amount: string;

  @Column({type: 'date'})
  expense_date: string;

  @Column({type: 'int', nullable: true})
  approved_by: number | null;

  @ManyToOne(() => User, {onDelete: 'SET NULL', nullable: true})
  @JoinColumn({name: 'approved_by'})
  approver: User | null;

  @Column({type: 'timestamp', nullable: true})
  approved_at: Date | null;

  @Column({type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING})
  status: ExpenseStatus;

  @Column({type: 'varchar', length: 500, nullable: true})
  receipt_url: string | null;

  @Column({type: 'text', nullable: true})
  description: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;
}
