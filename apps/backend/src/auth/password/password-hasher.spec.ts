import { PasswordHasher } from "./password-hasher";

describe("PasswordHasher", () => {
  const hasher = new PasswordHasher();
  const password = "Correct Horse Battery Staple 42!";
  let storedHash: string;

  beforeAll(async () => {
    storedHash = await hasher.hash(password);
  });

  it("hashes and verifies the correct password", async () => {
    expect(storedHash).toMatch(/^scrypt\$/);
    expect(storedHash).not.toContain(password);
    await expect(hasher.verify(password, storedHash)).resolves.toBe(true);
  });

  it("uses a different random salt for every hash", async () => {
    const secondHash = await hasher.hash(password);

    expect(secondHash).not.toBe(storedHash);
  });

  it("rejects an incorrect password", async () => {
    await expect(
      hasher.verify("An incorrect password", storedHash),
    ).resolves.toBe(false);
  });

  it.each(["", "invalid", "scrypt$invalid"])(
    "rejects a malformed stored hash",
    async (malformedHash) => {
      await expect(hasher.verify(password, malformedHash)).resolves.toBe(false);
    },
  );
});
