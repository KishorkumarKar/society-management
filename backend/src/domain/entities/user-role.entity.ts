import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn} from 'typeorm';
import {User} from './user.entity';
import {Role} from './role.entity';

@Entity('user_roles')
@Index(['user_id', 'role_id'], {unique: true})
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  user_id: number;

  @ManyToOne(() => User, (user) => user.userRoles, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User;

  @Column({type: 'int'})
  role_id: number;

  @ManyToOne(() => Role, (role) => role.userRoles, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'role_id'})
  role: Role;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;
}
