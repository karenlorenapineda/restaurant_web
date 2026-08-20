import { Inject, Injectable } from "@nestjs/common";

import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from "./auth-session.repository";
import { SessionTokenService } from "./session-token.service";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreatedBrowserSession {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthSessionService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    private readonly tokens: SessionTokenService,
  ) {}

  async createForUser(userId: string): Promise<CreatedBrowserSession> {
    const { token, tokenHash } = this.tokens.create();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await this.sessions.createSession({
      userId,
      tokenHash,
      expiresAt,
    });

    return {
      token,
      expiresAt,
    };
  }

  async resolveUserId(token: string): Promise<string | null> {
    const tokenHash = this.tokens.hash(token);
    const session = await this.sessions.findByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    return session.userId;
  }

  async revoke(token: string): Promise<void> {
    const tokenHash = this.tokens.hash(token);

    await this.sessions.deleteByTokenHash(tokenHash);
  }
}
