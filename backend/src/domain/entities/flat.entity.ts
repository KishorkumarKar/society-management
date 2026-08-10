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
import {MaintenanceBill} from './maintenance-bill.entity';

@Entity('flats')
@Index(['society_id'])
@Index(['owner_id'])
@Index(['society_id', 'block', 'unit_no'], {unique: true})
export class Flat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, (society) => society.flats, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'varchar', length: 50})
  block: string;

  @Column({type: 'varchar', length: 20})
  floor: string;

  @Column({type: 'varchar', length: 20})
  unit_no: string;

  @Column({type: 'int', nullable: true})
  owner_id: number | null;

  @ManyToOne(() => User, {onDelete: 'SET NULL', nullable: true})
  @JoinColumn({name: 'owner_id'})
  owner: User | null;

  @Column({type: 'decimal', precision: 10, scale: 2, default: 0})
  sqft: string;

  @Column({type: 'decimal', precision: 10, scale: 2, nullable: true})
  price_per_sqft: string | null;

  @Column({type: 'decimal', precision: 10, scale: 2, nullable: true})
  fix_price: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => User, (user) => user.flat)
  residents: User[];

  @OneToMany(() => MaintenanceBill, (bill) => bill.flat)
  maintenanceBills: MaintenanceBill[];
}
