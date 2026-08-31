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
import {Flat} from './flat.entity';

export enum HallBookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Deliberately NO unique DB constraint on (society_id, hall_name,
 * start_datetime, end_datetime): a rejected or cancelled booking must free
 * up the slot for someone else to book again, and MySQL has no
 * partial/filtered unique index to express "unique only among
 * pending/approved rows". That rule is instead enforced in
 * HallBookingsService.create() inside a transaction with a row lock (see
 * comments there), using a datetime-range overlap check rather than an
 * exact-match check — so two requests whose ranges merely *intersect*
 * (not just exact duplicates) are still caught. This index exists purely
 * to make that lookup — and the list-by-hall/date-range filter — fast.
 */
@Entity('hall_bookings')
@Index(['society_id'])
@Index(['society_id', 'start_datetime'])
@Index(['society_id', 'hall_name', 'start_datetime', 'end_datetime'])
@Index(['flat_id'])
@Index(['status'])
export class HallBooking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int'})
  flat_id: number;

  @ManyToOne(() => Flat, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'flat_id'})
  flat: Flat;

  @Column({type: 'varchar', length: 100})
  hall_name: string;

  /** Inclusive start of the booked slot. */
  @Column({type: 'datetime'})
  start_datetime: Date;

  /** Exclusive end of the booked slot (end_datetime must be > start_datetime). */
  @Column({type: 'datetime'})
  end_datetime: Date;

  @Column({type: 'varchar', length: 255, nullable: true})
  purpose: string | null;

  @Column({type: 'enum', enum: HallBookingStatus, default: HallBookingStatus.PENDING})
  status: HallBookingStatus;

  @Column({type: 'decimal', precision: 10, scale: 2, default: 0})
  amount: string;

  @Column({type: 'decimal', precision: 10, scale: 2, default: 0})
  deposit: string;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;
}
