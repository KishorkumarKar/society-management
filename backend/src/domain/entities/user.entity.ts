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
import {UserRole} from './user-role.entity';
import {RefreshToken} from './refresh-token.entity';

@Entity('users')
@Index(['society_id'])
@Index(['flat_id'])
@Index(['email'])
@Index(['phone'])
@Index(['society_id', 'email'], {unique: true})
@Index(['society_id', 'phone'], {unique: true})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, (society) => society.users, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int', nullable: true})
  flat_id: number | null;

  @ManyToOne(() => Flat, (flat) => flat.residents, {onDelete: 'SET NULL', nullable: true})
  @JoinColumn({name: 'flat_id'})
  flat: Flat | null;

  @Column({type: 'varchar', length: 150})
  name: string;

  @Column({type: 'varchar', length: 150, nullable: true})
  email: string | null;

  @Column({type: 'varchar', length: 20, nullable: true})
  phone: string | null;

  /** Never selected by default — see repository helpers. Never serialized. */
  @Column({type: 'varchar', length: 255, select: false})
  password_hash: string;

  @Column({type: 'boolean', default: true})
  is_active: boolean;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens: RefreshToken[];

  /**
   * Explicit allow-list serializer. Used everywhere a User is sent to a
   * client so that a forgotten `select: false` elsewhere can never leak the
   * hash — this is the last line of defense, not the only one.
   */
  toSafeJSON() {
    return {
      id: this.id,
      societyId: this.society_id,
      flatId: this.flat_id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      isActive: this.is_active,
      createdAt: this.created_at,
      updatedAt: this.updated_at,
    };
  }
}
