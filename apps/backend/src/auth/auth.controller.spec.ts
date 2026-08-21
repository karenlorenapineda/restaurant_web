import { Request, Response } from "express";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthenticatedRequest } from "./guard/session-auth.guard";
import { AuthSessionService } from "./session/auth-session.service";

describe("AuthController", () => {
  let controller: AuthController;
  let auth: jest.Mocked<AuthService>;
  let sessions: jest.Mocked<AuthSessionService>;
  let response: jest.Mocked<Response>;

  const publicUser = {
    id: "user-42",
    email: "user@example.com",
  };
  const expiresAt = new Date("2026-08-27T12:00:00.000Z");

  beforeEach(() => {
    auth = {
      register: jest.fn(),
      authenticate: jest.fn(),
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    sessions = {
      createForUser: jest.fn(),
      revoke: jest.fn(),
    } as unknown as jest.Mocked<AuthSessionService>;

    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as jest.Mocked<Response>;

    controller = new AuthController(auth, sessions);
  });

  it("registers a user and sets a protected session cookie", async () => {
    const input: RegisterDto = {
      email: "user@example.com",
      password: "Correct Horse Battery Staple 42!",
    };
    auth.register.mockResolvedValue(publicUser);
    sessions.createForUser.mockResolvedValue({
      token: "raw-session-token",
      expiresAt,
    });

    await expect(controller.register(input, response)).resolves.toEqual(
      publicUser,
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "picasso_session",
      "raw-session-token",
      {
        expires: expiresAt,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: true,
      },
    );
  });

  it("authenticates a user and rotates the session cookie", async () => {
    const input: LoginDto = {
      email: "user@example.com",
      password: "Correct Horse Battery Staple 42!",
    };
    auth.authenticate.mockResolvedValue(publicUser);
    sessions.createForUser.mockResolvedValue({
      token: "new-session-token",
      expiresAt,
    });

    await expect(controller.login(input, response)).resolves.toEqual(
      publicUser,
    );
    expect(sessions.createForUser).toHaveBeenCalledWith(publicUser.id);
    expect(response.cookie).toHaveBeenCalledWith(
      "picasso_session",
      "new-session-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      }),
    );
  });

  it("revokes the current session and clears its cookie", async () => {
    const request = {
      cookies: {
        picasso_session: "raw-session-token",
      },
    } as unknown as Request;
    sessions.revoke.mockResolvedValue();

    await controller.logout(request, response);

    expect(sessions.revoke).toHaveBeenCalledWith("raw-session-token");
    expect(response.clearCookie).toHaveBeenCalledWith("picasso_session", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("clears the cookie safely when no session exists", async () => {
    const request = { cookies: {} } as unknown as Request;

    await controller.logout(request, response);

    expect(sessions.revoke).not.toHaveBeenCalled();
    expect(response.clearCookie).toHaveBeenCalledWith(
      "picasso_session",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
      }),
    );
  });
  it("returns the currently authenticated user", async () => {
    const request = {
      auth: {
        userId: "user-42",
      },
    } as unknown as AuthenticatedRequest;
    auth.getCurrentUser.mockResolvedValue(publicUser);

    await expect(controller.me(request)).resolves.toEqual(publicUser);
    expect(auth.getCurrentUser).toHaveBeenCalledWith("user-42");
  });
});
