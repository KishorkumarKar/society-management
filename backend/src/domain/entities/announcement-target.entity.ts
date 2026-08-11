import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn} from 'typeorm';
import {Announcement} from './announcement.entity';
import {Role} from './role.entity';

@Entity('announcement_targets')
@Index(['announcement_id'])
@Index(['role_id'])
@Index(['announcement_id', 'role_id'], {unique: true})
export class AnnouncementTarget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  announcement_id: number;

  @ManyToOne(() => Announcement, (announcement) => announcement.targets, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'announcement_id'})
  announcement: Announcement;

  @Column({type: 'int'})
  role_id: number;

  @ManyToOne(() => Role, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'role_id'})
  role: Role;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;
}
