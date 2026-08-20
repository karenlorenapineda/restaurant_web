import { AuthSessionService } from "./auth-session.service";
import { AuthSession, AuthSessionRepository } from "./auth-session.repository";
import { SessionTokenService } from "./session-token.service";

describe("AuthSessionService", () => {
  let service: AuthSessionService;
  let repository: jest.Mocked<AuthSessionRepository>;
  let tokens: jest.Mocked<SessionTokenService>;

  const now = new Date("2026-08-20T12:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    repository = {
      createSession: jest.fn(),
      findByTokenHash: jest.fn(),
      deleteByTokenHash: jest.fn(),
    };

    tokens = {
      create: jest.fn(),
      hash: jest.fn(),
    } as unknown as jest.Mocked<SessionTokenService>;

    service = new AuthSessionService(repository, tokens);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates a seven-day session and returns only the raw token", async () => {
    tokens.create.mockReturnValue({
      token: "raw-session-token",
      tokenHash: "stored-session-hash",
    });
    repository.createSession.mockImplementation(async (input) => ({
      id: "session-42",
      ...input,
    }));

    await expect(service.createForUser("user-42")).resolves.toEqual({
      token: "raw-session-token",
      expiresAt: new Date("2026-08-27T12:00:00.000Z"),
    });
    expect(repository.createSession).toHaveBeenCalledWith({
      userId: "user-42",
      tokenHash: "stored-session-hash",
      expiresAt: new Date("2026-08-27T12:00:00.000Z"),
    });
  });

  it("resolves the user from a valid session", async () => {
    const session: AuthSession = {
      id: "session-42",
      userId: "user-42",
      tokenHash: "stored-session-hash",
      expiresAt: new Date("2026-08-21T12:00:00.000Z"),
    };
    tokens.hash.mockReturnValue(session.tokenHash);
    repository.findByTokenHash.mockResolvedValue(session);

    await expect(service.resolveUserId("raw-session-token")).resolves.toBe(
      "user-42",
    );
  });

  it("deletes and rejects an expired session", async () => {
    const expiredSession: AuthSession = {
      id: "session-42",
      userId: "user-42",
      tokenHash: "stored-session-hash",
      expiresAt: new Date("2026-08-20T11:59:59.000Z"),
    };
    tokens.hash.mockReturnValue(expiredSession.tokenHash);
    repository.findByTokenHash.mockResolvedValue(expiredSession);
    repository.deleteByTokenHash.mockResolvedValue();

    await expect(service.resolveUserId("expired-token")).resolves.toBeNull();
    expect(repository.deleteByTokenHash).toHaveBeenCalledWith(
      expiredSession.tokenHash,
    );
  });

  it("revokes a session using the hash of its raw token", async () => {
    tokens.hash.mockReturnValue("stored-session-hash");
    repository.deleteByTokenHash.mockResolvedValue();

    await service.revoke("raw-session-token");

    expect(repository.deleteByTokenHash).toHaveBeenCalledWith(
      "stored-session-hash",
    );
  });
});
