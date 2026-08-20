export interface AuthSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface CreateAuthSession {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface AuthSessionRepository {
  createSession(input: CreateAuthSession): Promise<AuthSession>;
  findByTokenHash(tokenHash: string): Promise<AuthSession | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol("AUTH_SESSION_REPOSITORY");
