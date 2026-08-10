import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn} from 'typeorm';
import {Role} from './role.entity';
import {Permission} from './permission.entity';

@Entity('role_permissions')
@Index(['role_id', 'permission_id'], {unique: true})
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  role_id: number;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'role_id'})
  role: Role;

  @Column({type: 'int'})
  permission_id: number;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'permission_id'})
  permission: Permission;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;
}
