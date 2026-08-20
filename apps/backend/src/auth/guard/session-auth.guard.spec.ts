import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

import { AuthSessionService } from "../session/auth-session.service";
import { SessionAuthGuard } from "./session-auth.guard";

describe("SessionAuthGuard", () => {
  let guard: SessionAuthGuard;
  let sessions: jest.Mocked<AuthSessionService>;

  beforeEach(() => {
    sessions = {
      resolveUserId: jest.fn(),
    } as unknown as jest.Mocked<AuthSessionService>;

    guard = new SessionAuthGuard(sessions);
  });

  function createContext(request: object): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it("allows a valid session and attaches its user ID", async () => {
    const request = {
      cookies: {
        picasso_session: "raw-session-token",
      },
    };
    sessions.resolveUserId.mockResolvedValue("user-42");

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toEqual({
      cookies: {
        picasso_session: "raw-session-token",
      },
      auth: {
        userId: "user-42",
      },
    });
  });

  it("rejects a request without a session cookie", async () => {
    const context = createContext({ cookies: {} });

    await expect(guard.canActivate(context)).rejects.toEqual(
      new UnauthorizedException("Authentication required"),
    );
    expect(sessions.resolveUserId).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired session", async () => {
    sessions.resolveUserId.mockResolvedValue(null);
    const context = createContext({
      cookies: {
        picasso_session: "invalid-session-token",
      },
    });

    await expect(guard.canActivate(context)).rejects.toEqual(
      new UnauthorizedException("Authentication required"),
    );
  });

  it("rejects a non-string cookie value", async () => {
    const context = createContext({
      cookies: {
        picasso_session: ["unexpected"],
      },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions.resolveUserId).not.toHaveBeenCalled();
  });
});
