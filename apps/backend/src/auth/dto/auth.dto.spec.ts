import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { LoginDto } from "./login.dto";
import { RegisterDto } from "./register.dto";

describe("Authentication DTOs", () => {
  describe("RegisterDto", () => {
    it("accepts and normalizes valid registration data", async () => {
      const dto = plainToInstance(RegisterDto, {
        email: "  User@Example.COM ",
        password: "Correct Horse Battery Staple 42!",
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.email).toBe("user@example.com");
      expect(dto.password).toBe("Correct Horse Battery Staple 42!");
    });

    it.each([
      [
        "an invalid email",
        { email: "invalid", password: "A secure password 42!" },
      ],
      ["an empty email", { email: "", password: "A secure password 42!" }],
      ["a short password", { email: "user@example.com", password: "short" }],
      [
        "an excessively long password",
        { email: "user@example.com", password: "a".repeat(129) },
      ],
      ["a missing password", { email: "user@example.com" }],
      [
        "an unexpected password type",
        {
          email: "user@example.com",
          password: 123456789012,
        },
      ],
    ])("rejects %s", async (_case, input) => {
      const errors = await validate(plainToInstance(RegisterDto, input));

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("LoginDto", () => {
    it("accepts and normalizes valid login data", async () => {
      const dto = plainToInstance(LoginDto, {
        email: "  User@Example.COM ",
        password: "Correct Horse Battery Staple 42!",
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.email).toBe("user@example.com");
      expect(dto.password).toBe("Correct Horse Battery Staple 42!");
    });

    it.each([
      [
        "an invalid email",
        { email: "invalid", password: "A secure password 42!" },
      ],
      ["an empty password", { email: "user@example.com", password: "" }],
      [
        "an excessively long password",
        { email: "user@example.com", password: "a".repeat(129) },
      ],
      ["a missing email", { password: "A secure password 42!" }],
      [
        "an unexpected email type",
        {
          email: 42,
          password: "A secure password 42!",
        },
      ],
    ])("rejects %s", async (_case, input) => {
      const errors = await validate(plainToInstance(LoginDto, input));

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
