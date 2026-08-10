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
import {UserRole} from './user-role.entity';
import {RolePermission} from './role-permission.entity';

@Entity('roles')
@Index(['society_id'])
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * NULL => system/global role (e.g. Super Admin), visible/assignable
   * across all societies. Non-null => scoped to exactly that society.
   */
  @Column({type: 'int', nullable: true})
  society_id: number | null;

  @ManyToOne(() => Society, (society) => society.roles, {onDelete: 'CASCADE', nullable: true})
  @JoinColumn({name: 'society_id'})
  society: Society | null;

  @Column({type: 'varchar', length: 100})
  name: string;

  @Column({type: 'text', nullable: true})
  description: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  get isGlobal(): boolean {
    return this.society_id === null;
  }
}
