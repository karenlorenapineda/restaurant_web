export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string | null;
}

export interface CreateLocalAuthUser {
  email: string;
  passwordHash: string;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  createLocalUser(input: CreateLocalAuthUser): Promise<AuthUser>;
}

export const AUTH_USER_REPOSITORY = Symbol("AUTH_USER_REPOSITORY");
