import { SessionTokenService } from "./session-token.service";

describe("SessionTokenService", () => {
  const tokens = new SessionTokenService();

  it("creates a random token and its SHA-256 hash", () => {
    const session = tokens.create();

    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(session.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session.tokenHash).toBe(tokens.hash(session.token));
    expect(session.tokenHash).not.toContain(session.token);
  });

  it("creates a different token for every session", () => {
    const first = tokens.create();
    const second = tokens.create();

    expect(second.token).not.toBe(first.token);
    expect(second.tokenHash).not.toBe(first.tokenHash);
  });

  it("always hashes the same token deterministically", () => {
    const token = tokens.create().token;

    expect(tokens.hash(token)).toBe(tokens.hash(token));
  });
});
