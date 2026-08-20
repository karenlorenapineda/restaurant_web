import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const ALGORITHM = "scrypt";
const SALT_LENGTH = 16;
const DERIVED_KEY_LENGTH = 64;

export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = (await scrypt(
      password,
      salt,
      DERIVED_KEY_LENGTH,
    )) as Buffer;

    return [
      ALGORITHM,
      salt.toString("base64url"),
      derivedKey.toString("base64url"),
    ].join("$");
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, encodedSalt, encodedKey, ...extraParts] =
      storedHash.split("$");

    if (
      algorithm !== ALGORITHM ||
      !encodedSalt ||
      !encodedKey ||
      extraParts.length > 0
    ) {
      return false;
    }

    try {
      const salt = Buffer.from(encodedSalt, "base64url");
      const expectedKey = Buffer.from(encodedKey, "base64url");
      if (
        salt.length !== SALT_LENGTH ||
        expectedKey.length !== DERIVED_KEY_LENGTH
      ) {
        return false;
      }

      const actualKey = (await scrypt(
        password,
        salt,
        DERIVED_KEY_LENGTH,
      )) as Buffer;

      return timingSafeEqual(actualKey, expectedKey);
    } catch {
      return false;
    }
  }
}
