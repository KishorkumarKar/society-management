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
import {Flat} from './flat.entity';
import {MaintenancePayment} from './maintenance-payment.entity';

export enum MaintenanceBillStatus {
  DUE = 'due',
  PAID = 'paid',
  OVERDUE = 'overdue',
  APPROVED = 'approved',
}

@Entity('maintenance_bills')
@Index(['society_id', 'flat_id', 'billing_year', 'billing_month'], {unique: true})
@Index(['society_id', 'billing_year', 'billing_month'])
@Index(['society_id', 'flat_id'])
@Index(['society_id', 'status'])
export class MaintenanceBill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, (society) => society.maintenanceBills, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int'})
  flat_id: number;

  @ManyToOne(() => Flat, (flat) => flat.maintenanceBills, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'flat_id'})
  flat: Flat;

  @Column({type: 'int'})
  billing_year: number;

  @Column({type: 'smallint'})
  billing_month: number;

  @Column({type: 'decimal', precision: 10, scale: 2})
  amount: string;

  @Column({type: 'date'})
  due_date: string;

  @Column({type: 'enum', enum: MaintenanceBillStatus, default: MaintenanceBillStatus.DUE})
  status: MaintenanceBillStatus;

  @Column({type: 'timestamp', nullable: true})
  paid_at: Date | null;

  @Column({type: 'decimal', precision: 10, scale: 2, default: 0})
  penalty: string;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => MaintenancePayment, (payment) => payment.bill)
  payments: MaintenancePayment[];
}
