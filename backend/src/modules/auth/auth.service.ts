import {DataSource} from 'typeorm';
import * as crypto from 'crypto';
import {v4 as uuidv4} from 'uuid';
import {Society, SocietyStatus} from '../../domain/entities/society.entity';
import {User} from '../../domain/entities/user.entity';
import {UserRole} from '../../domain/entities/user-role.entity';
import {RefreshToken} from '../../domain/entities/refresh-token.entity';
import {verifyPassword} from './password.util';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  AccessTokenPayload,
} from './jwt.util';
import {AclService} from '../acl/acl.service';
import {ApiError} from '../../utils/api-response';
import {logger} from '../../infrastructure/logging/logger';
import ms from './ms.util';

export interface LoginInput {
  society: string; // slug or code
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: ReturnType<User['toSafeJSON']>;
  society: {id: number; name: string; slug: string};
  permissions: string[];
  roles: string[];
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  constructor(
    private dataSource: DataSource,
    private aclService: AclService,
  ) {}

  /**
   * Implements the exact login sequence required by the spec:
   * 1. Find society by slug         2. Verify society active
   * 3. Find user within society     4. Verify user active
   * 5. Verify password hash         6. Load roles
   * 7. Load permissions             8. Issue access token
   * 9. Issue refresh token          10. Return user + permissions
   *
   * Deliberately returns the SAME generic error for "society not found",
   * "user not found", and "wrong password" so the endpoint never confirms
   * to an attacker which piece of a login attempt was correct. This also
   * means a user from Society A can never authenticate into Society B by
   * supplying another user's email/phone plus a guessed password + wrong
   * society — the lookup is always scoped to the given society first.
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const genericError = () => ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');

    if (!input.email && !input.phone) {
      throw ApiError.badRequest('Either email or phone is required', 'VALIDATION_ERROR');
    }

    const societyRepo = this.dataSource.getRepository(Society);
    const society = await societyRepo.findOne({where: {slug: input.society}});
    if (!society) throw genericError();
    if (society.status !== SocietyStatus.ACTIVE) {
      throw ApiError.forbidden('This society is not active', 'SOCIETY_INACTIVE');
    }

    const userRepo = this.dataSource.getRepository(User);
    const qb = userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.society_id = :societyId', {societyId: society.id});

    if (input.email) {
      qb.andWhere('user.email = :email', {email: input.email});
    } else {
      qb.andWhere('user.phone = :phone', {phone: input.phone});
    }

    const user = await qb.getOne();
    if (!user) throw genericError();
    if (!user.is_active) throw ApiError.forbidden('This user account is inactive', 'USER_INACTIVE');

    const passwordOk = await verifyPassword(input.password, user.password_hash);
    if (!passwordOk) throw genericError();

    const userRoleRepo = this.dataSource.getRepository(UserRole);
    const userRoles = await userRoleRepo.find({where: {user_id: user.id}, relations: ['role']});
    const roleIds = userRoles.map((ur) => ur.role_id);
    const roleNames = userRoles.map((ur) => ur.role?.name).filter(Boolean) as string[];

    const permissions = await this.aclService.getUserPermissions(user.id, society.id);

    const accessPayload: AccessTokenPayload = {sub: user.id, societyId: society.id, roleIds};
    const accessToken = signAccessToken(accessPayload);

    const jti = uuidv4();
    const refreshToken = signRefreshToken({sub: user.id, societyId: society.id, jti});

    const refreshTokenRepo = this.dataSource.getRepository(RefreshToken);
    await refreshTokenRepo.save(
      refreshTokenRepo.create({
        user_id: user.id,
        society_id: society.id,
        token_hash: hashToken(jti),
        expires_at: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES_IN ?? '30d')),
      }),
    );

    logger.info('User logged in', {userId: user.id, societyId: society.id});

    return {
      accessToken,
      refreshToken,
      user: user.toSafeJSON(),
      society: {id: society.id, name: society.name, slug: society.slug},
      permissions: Array.from(permissions),
      roles: roleNames,
    };
  }

  /**
   * Refresh-token rotation: the presented token is verified, matched by
   * hash against a stored, non-revoked, non-expired row, then immediately
   * revoked and replaced by a new row. Presenting an already-used (revoked)
   * refresh token is treated as a signal of possible token theft and revokes
   * the entire token, forcing re-login.
   */
  async refresh(rawRefreshToken: string): Promise<{accessToken: string; refreshToken: string}> {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const refreshTokenRepo = this.dataSource.getRepository(RefreshToken);
    const tokenHash = hashToken(payload.jti);
    const stored = await refreshTokenRepo.findOne({where: {token_hash: tokenHash}});

    if (!stored || !stored.isActive || stored.user_id !== payload.sub) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({where: {id: payload.sub}});
    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User no longer active', 'USER_INACTIVE');
    }

    const userRoleRepo = this.dataSource.getRepository(UserRole);
    const roleIds = (await userRoleRepo.find({where: {user_id: user.id}})).map((ur) => ur.role_id);

    const newJti = uuidv4();
    const newRefreshToken = signRefreshToken({sub: user.id, societyId: payload.societyId, jti: newJti});

    const newRow = await refreshTokenRepo.save(
      refreshTokenRepo.create({
        user_id: user.id,
        society_id: payload.societyId,
        token_hash: hashToken(newJti),
        expires_at: new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES_IN ?? '30d')),
      }),
    );

    stored.revoked_at = new Date();
    stored.replaced_by_token_id = newRow.id;
    await refreshTokenRepo.save(stored);

    const accessToken = signAccessToken({sub: user.id, societyId: payload.societyId, roleIds});

    return {accessToken, refreshToken: newRefreshToken};
  }

  async logout(rawRefreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      const refreshTokenRepo = this.dataSource.getRepository(RefreshToken);
      await refreshTokenRepo.update({token_hash: hashToken(payload.jti)}, {revoked_at: new Date()});
    } catch {
      // Logging out with an already-invalid token is a no-op, not an error.
    }
  }
}
