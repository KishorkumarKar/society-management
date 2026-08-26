/**
 * The authenticated context attached to every request after the auth
 * middleware runs. This — never the request body — is the sole source of
 * truth for "who is asking" and "which society do they belong to".
 */
export interface CurrentUserContext {
  userId: number;
  societyId: number;
  roleIds: number[];
  roleType?: string[];
  isSupperAdmin?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: CurrentUserContext;
      requestId?: string;
    }
  }
}

export {};
