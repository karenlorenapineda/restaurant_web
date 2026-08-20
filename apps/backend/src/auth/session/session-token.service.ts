import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_LENGTH_BYTES = 32;

export interface CreatedSessionToken {
  token: string;
  tokenHash: string;
}

@Injectable()
export class SessionTokenService {
  create(): CreatedSessionToken {
    const token = randomBytes(TOKEN_LENGTH_BYTES).toString("base64url");

    return {
      token,
      tokenHash: this.hash(token),
    };
  }

  hash(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }
}
