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
import {AnnouncementTarget} from './announcement-target.entity';

export enum AnnouncementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Targeting is normalized into `announcement_targets` (see that entity) —
 * reusing the existing `roles` table — rather than a JSON array of role
 * name strings, per the spec's own stated preference for reliable,
 * queryable role-based targeting. An announcement with NO target rows is
 * society-wide (visible to every role in the society).
 */
@Entity('announcements')
@Index(['society_id'])
@Index(['priority'])
@Index(['created_at'])
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  society_id: number;

  @ManyToOne(() => Society, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'society_id'})
  society: Society;

  @Column({type: 'varchar', length: 200})
  title: string;

  @Column({type: 'text'})
  body: string;

  @Column({type: 'enum', enum: AnnouncementPriority, default: AnnouncementPriority.NORMAL})
  priority: AnnouncementPriority;

  @Column({type: 'timestamp', nullable: true})
  sent_at: Date | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp'})
  updated_at: Date;

  @DeleteDateColumn({type: 'timestamp', nullable: true})
  deleted_at: Date | null;

  @OneToMany(() => AnnouncementTarget, (target) => target.announcement)
  targets: AnnouncementTarget[];
}
