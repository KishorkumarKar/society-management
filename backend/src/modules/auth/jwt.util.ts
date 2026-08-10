import * as jwt from 'jsonwebtoken';
import {config} from '../../config/env.config';

/**
 * Deliberately minimal claim set. Permissions are NEVER embedded here (see
 * acl/permission-cache.ts) since they can change between token issuance and
 * expiry; role IDs are included only as a hint, authorization always
 * re-checks against the DB/cache, never trusts these claims for a decision.
 */
export interface AccessTokenPayload {
  sub: number; // user id
  societyId: number;
  roleIds: number[];
}

export interface RefreshTokenPayload {
  sub: number;
  societyId: number;
  jti: string; // unique id for this refresh token, matches refresh_tokens row
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: config.jwt.issuer,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret, {issuer: config.jwt.issuer}) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: config.jwt.issuer,
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret, {issuer: config.jwt.issuer}) as RefreshTokenPayload;
}
