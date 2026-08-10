import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import {User} from './user.entity';
import {Flat} from './flat.entity';
import {MaintenanceBill} from './maintenance-bill.entity';
import {Role} from './role.entity';

export enum RateType {
  PER_SQFT = 'PER_SQFT',
  FIXED = 'FIXED',
}

export enum SocietyStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

@Entity('societies')
@Index(['slug'], {unique: true})
export class Society {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'varchar', length: 150})
  name: string;

  @Column({type: 'varchar', length: 100})
  city: string;

  @Column({type: 'text'})
  address: string;

  @Column({type: 'varchar', length: 100, unique: true})
  slug: string;

  @Column({type: 'int', unsigned: true, default: 0, comment: 'Max active users allowed for this society'})
  user_limit: number;

  @Column({type: 'varchar', length: 100, nullable: true, unique: true})
  registration_no: string | null;

  @Column({type: 'tinyint', default: SocietyStatus.ACTIVE})
  status: SocietyStatus;

  @Column({type: 'enum', enum: RateType, default: RateType.PER_SQFT})
  rate_type: RateType;

  @Column({type: 'decimal', precision: 10, scale: 2, default: 0})
  rate_per_sqft: string;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => User, (user) => user.society)
  users: User[];

  @OneToMany(() => Flat, (flat) => flat.society)
  flats: Flat[];

  @OneToMany(() => MaintenanceBill, (bill) => bill.society)
  maintenanceBills: MaintenanceBill[];

  @OneToMany(() => Role, (role) => role.society)
  roles: Role[];

  get isActive(): boolean {
    return this.status === SocietyStatus.ACTIVE;
  }
}
