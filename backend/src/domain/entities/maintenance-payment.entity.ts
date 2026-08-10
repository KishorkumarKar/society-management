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
import {MaintenanceBill} from './maintenance-bill.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CHEQUE = 'cheque',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  OTHER = 'other',
}

/**
 * Kept deliberately independent of MaintenanceBill's own status field: a
 * bill's `status` is a derived/administrative label, while a bill's true
 * outstanding balance is always computed as
 *   bill.amount + bill.penalty - SUM(payments.amount WHERE status='success')
 * This supports partial payments without ever conflating "one payment
 * happened" with "the bill is settled".
 */
@Entity('maintenance_payments')
@Index(['society_id'])
@Index(['maintenance_bill_id'])
@Index(['transaction_id'])
export class MaintenancePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int'})
  maintenance_bill_id: number;

  @ManyToOne(() => MaintenanceBill, (bill) => bill.payments, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'maintenance_bill_id'})
  bill: MaintenanceBill;

  @Column({type: 'decimal', precision: 10, scale: 2})
  amount: string;

  @Column({type: 'date'})
  payment_date: string;

  @Column({type: 'enum', enum: PaymentMethod})
  payment_method: PaymentMethod;

  @Column({type: 'varchar', length: 150, nullable: true})
  transaction_id: string | null;

  @Column({type: 'enum', enum: PaymentStatus, default: PaymentStatus.SUCCESS})
  status: PaymentStatus;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;
}
