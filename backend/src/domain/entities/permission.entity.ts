import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import {RolePermission} from './role-permission.entity';

@Entity('permissions')
@Index(['resource', 'action'], {unique: true})
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  /** Canonical form is always `resource.action`, kept in sync at write time. */
  @Column({type: 'varchar', length: 150, unique: true})
  name: string;

  @Column({type: 'varchar', length: 100})
  resource: string;

  @Column({type: 'varchar', length: 100})
  action: string;

  @Column({type: 'text', nullable: true})
  description: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];
}
