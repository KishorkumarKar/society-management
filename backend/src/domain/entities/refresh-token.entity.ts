import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn} from 'typeorm';
import {User} from './user.entity';

/**
 * Only a SHA-256 hash of the refresh token is ever stored — the raw token
 * exists only in the client's possession and in the (redacted) response
 * body at issuance time. This lets us revoke and detect reuse without the
 * DB ever holding a usable credential.
 */
@Entity('refresh_tokens')
@Index(['user_id'])
@Index(['token_hash'], {unique: true})
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: 'int'})
  user_id: number;

  @ManyToOne(() => User, (user) => user.refreshTokens, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User;

  @Column({type: 'int'})
  society_id: number;

  @Column({type: 'varchar', length: 255})
  token_hash: string;

  @Column({type: 'timestamp'})
  expires_at: Date;

  @Column({type: 'timestamp', nullable: true})
  revoked_at: Date | null;

  @Column({type: 'int', nullable: true})
  replaced_by_token_id: number | null;

  @CreateDateColumn({type: 'timestamp'})
  created_at: Date;

  get isActive(): boolean {
    return !this.revoked_at && this.expires_at.getTime() > Date.now();
  }
}
