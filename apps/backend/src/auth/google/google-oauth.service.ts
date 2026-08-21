import { UnauthorizedException } from "@nestjs/common";
import * as oidc from "openid-client";

const GOOGLE_ISSUER = new URL("https://accounts.google.com");

export interface GoogleOAuthConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleOAuthTransaction {
  codeVerifier: string;
  nonce: string;
  state: string;
}

export interface GoogleAuthorizationRequest {
  url: string;
  transaction: GoogleOAuthTransaction;
}

export interface GoogleIdentity {
  subject: string;
  email: string;
  name?: string;
  picture?: string;
}

export class GoogleOAuthService {
  private readonly configuration: Promise<oidc.Configuration>;

  constructor(private readonly settings: GoogleOAuthConfiguration) {
    this.configuration = oidc.discovery(
      GOOGLE_ISSUER,
      settings.clientId,
      settings.clientSecret,
    );
  }

  async createAuthorizationRequest(): Promise<GoogleAuthorizationRequest> {
    const configuration = await this.configuration;
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();

    const url = oidc.buildAuthorizationUrl(configuration, {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
      redirect_uri: this.settings.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
    });

    return {
      url: url.href,
      transaction: {
        codeVerifier,
        nonce,
        state,
      },
    };
  }

  async exchangeCallback(
    callbackUrl: URL,
    transaction: GoogleOAuthTransaction,
  ): Promise<GoogleIdentity> {
    const configuration = await this.configuration;

    let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;

    try {
      tokens = await oidc.authorizationCodeGrant(configuration, callbackUrl, {
        expectedNonce: transaction.nonce,
        expectedState: transaction.state,
        idTokenExpected: true,
        pkceCodeVerifier: transaction.codeVerifier,
      });
    } catch {
      throw new UnauthorizedException("Google authentication failed");
    }

    const claims = tokens.claims();
    const subject = claims?.sub;
    const email = claims?.email;
    const emailVerified = claims?.email_verified;

    if (typeof subject !== "string" || subject.length === 0) {
      throw new UnauthorizedException("Google identity is invalid");
    }

    if (typeof email !== "string" || email.length === 0) {
      throw new UnauthorizedException("Google account email is unavailable");
    }

    if (emailVerified !== true) {
      throw new UnauthorizedException("Google account email is not verified");
    }

    return {
      subject,
      email: email.trim().toLowerCase(),
      ...(typeof claims?.name === "string" && { name: claims.name }),
      ...(typeof claims?.picture === "string" && {
        picture: claims.picture,
      }),
    };
  }
}
