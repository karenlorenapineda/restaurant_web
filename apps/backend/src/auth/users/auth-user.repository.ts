export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string | null;
}

export interface CreateLocalAuthUser {
  email: string;
  passwordHash: string;
}

export type OAuthProvider = "google";

export interface OAuthIdentity {
  provider: OAuthProvider;
  subject: string;
  email: string;
}

export interface CreateOAuthAuthUser extends OAuthIdentity {}

export interface AuthUserRepository {
  findById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByOAuthIdentity(
    provider: OAuthProvider,
    subject: string,
  ): Promise<AuthUser | null>;
  createLocalUser(input: CreateLocalAuthUser): Promise<AuthUser>;
  createOAuthUser(input: CreateOAuthAuthUser): Promise<AuthUser>;
}

export const AUTH_USER_REPOSITORY = Symbol("AUTH_USER_REPOSITORY");
