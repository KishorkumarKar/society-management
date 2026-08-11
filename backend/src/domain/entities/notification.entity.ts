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
import {User} from './user.entity';

export enum NotificationChannelType {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Entity('notifications')
@Index(['society_id'])
@Index(['user_id'])
@Index(['user_id', 'is_read'])
@Index(['society_id', 'user_id', 'is_read'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'int'})
  user_id: number;

  @ManyToOne(() => User, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User;

  @Column({type: 'varchar', length: 100})
  type: string;

  @Column({type: 'varchar', length: 200})
  title: string;

  @Column({type: 'text', nullable: true})
  body: string | null;

  @Column({type: 'boolean', default: false})
  is_read: boolean;

  @Column({type: 'enum', enum: NotificationChannelType, default: NotificationChannelType.IN_APP})
  channel: NotificationChannelType;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;
}
