import { UnauthorizedException } from "@nestjs/common";
import * as oidc from "openid-client";

import { GoogleOAuthService } from "./google-oauth.service";

jest.mock("openid-client", () => ({
  authorizationCodeGrant: jest.fn(),
  buildAuthorizationUrl: jest.fn(),
  calculatePKCECodeChallenge: jest.fn(),
  discovery: jest.fn(),
  randomNonce: jest.fn(),
  randomPKCECodeVerifier: jest.fn(),
  randomState: jest.fn(),
}));

describe("GoogleOAuthService", () => {
  const configuration = {} as oidc.Configuration;
  let service: GoogleOAuthService;

  beforeEach(() => {
    jest.resetAllMocks();

    jest.mocked(oidc.discovery).mockResolvedValue(configuration);
    jest.mocked(oidc.randomState).mockReturnValue("random-state");
    jest.mocked(oidc.randomNonce).mockReturnValue("random-nonce");
    jest
      .mocked(oidc.randomPKCECodeVerifier)
      .mockReturnValue("random-code-verifier");
    jest
      .mocked(oidc.calculatePKCECodeChallenge)
      .mockResolvedValue("calculated-code-challenge");
    jest
      .mocked(oidc.buildAuthorizationUrl)
      .mockReturnValue(
        new URL("https://accounts.google.com/o/oauth2/v2/auth?mocked=true"),
      );

    service = new GoogleOAuthService({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      redirectUri: "https://localhost/api/auth/google/callback",
    });
  });

  it("creates an authorization request protected by state, nonce and PKCE", async () => {
    await expect(service.createAuthorizationRequest()).resolves.toEqual({
      url: "https://accounts.google.com/o/oauth2/v2/auth?mocked=true",
      transaction: {
        codeVerifier: "random-code-verifier",
        nonce: "random-nonce",
        state: "random-state",
      },
    });

    expect(oidc.discovery).toHaveBeenCalledWith(
      new URL("https://accounts.google.com"),
      "google-client-id",
      "google-client-secret",
    );
    expect(oidc.buildAuthorizationUrl).toHaveBeenCalledWith(configuration, {
      code_challenge: "calculated-code-challenge",
      code_challenge_method: "S256",
      nonce: "random-nonce",
      redirect_uri: "https://localhost/api/auth/google/callback",
      response_type: "code",
      scope: "openid email profile",
      state: "random-state",
    });
  });

  it("exchanges the callback and returns the stable Google identity", async () => {
    jest.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
      claims: () => ({
        sub: "google-subject-42",
        email: "User@Example.COM",
        email_verified: true,
        name: "Example User",
        picture: "https://example.com/avatar.jpg",
      }),
    } as unknown as Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>);

    await expect(
      service.exchangeCallback(
        new URL(
          "https://localhost/api/auth/google/callback?code=code&state=random-state",
        ),
        {
          codeVerifier: "random-code-verifier",
          nonce: "random-nonce",
          state: "random-state",
        },
      ),
    ).resolves.toEqual({
      subject: "google-subject-42",
      email: "user@example.com",
      name: "Example User",
      picture: "https://example.com/avatar.jpg",
    });

    expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(
      configuration,
      expect.any(URL),
      {
        expectedNonce: "random-nonce",
        expectedState: "random-state",
        idTokenExpected: true,
        pkceCodeVerifier: "random-code-verifier",
      },
    );
  });

  it("rejects a Google account without a verified email", async () => {
    jest.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
      claims: () => ({
        sub: "google-subject-42",
        email: "user@example.com",
        email_verified: false,
      }),
    } as unknown as Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>);

    await expect(
      service.exchangeCallback(new URL("https://localhost/callback"), {
        codeVerifier: "verifier",
        nonce: "nonce",
        state: "state",
      }),
    ).rejects.toEqual(
      new UnauthorizedException("Google account email is not verified"),
    );
  });

  it("rejects an ID token without a stable subject", async () => {
    jest.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
      claims: () => ({
        email: "user@example.com",
        email_verified: true,
      }),
    } as unknown as Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>);

    await expect(
      service.exchangeCallback(new URL("https://localhost/callback"), {
        codeVerifier: "verifier",
        nonce: "nonce",
        state: "state",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
