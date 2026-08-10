import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index} from 'typeorm';

/**
 * Append-only trail for ACL/financial-relevant mutations. Never updated or
 * deleted by application code.
 */
@Entity('audit_logs')
@Index(['society_id'])
@Index(['user_id'])
@Index(['resource', 'resource_id'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int', nullable: true})
  society_id: number | null;

  @Column({type: 'int', nullable: true})
  user_id: number | null;

  @Column({type: 'varchar', length: 100})
  action: string;

  @Column({type: 'varchar', length: 100})
  resource: string;

  @Column({type: 'int', nullable: true})
  resource_id: number | null;

  @Column({type: 'json', nullable: true})
  before_json: Record<string, unknown> | null;

  @Column({type: 'json', nullable: true})
  after_json: Record<string, unknown> | null;

  @Column({type: 'varchar', length: 64, nullable: true})
  ip_address: string | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;
}
