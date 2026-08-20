import { ConflictException, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { PasswordHasher } from "./password/password-hasher";
import { AuthUser, AuthUserRepository } from "./users/auth-user.repository";

describe("AuthService", () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthUserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

  const existingUser: AuthUser = {
    id: "user-42",
    email: "user@example.com",
    passwordHash: "scrypt$stored-salt$stored-key",
  };

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn(),
      createLocalUser: jest.fn(),
    };

    passwordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordHasher>;

    service = new AuthService(repository, passwordHasher);
  });

  describe("register", () => {
    const input: RegisterDto = {
      email: "user@example.com",
      password: "Correct Horse Battery Staple 42!",
    };

    it("hashes the password and creates a local user", async () => {
      repository.findByEmail.mockResolvedValue(null);
      passwordHasher.hash.mockResolvedValue("scrypt$new-salt$new-key");
      repository.createLocalUser.mockResolvedValue({
        id: "user-42",
        email: input.email,
        passwordHash: "scrypt$new-salt$new-key",
      });

      await expect(service.register(input)).resolves.toEqual({
        id: "user-42",
        email: input.email,
      });
      expect(passwordHasher.hash).toHaveBeenCalledWith(input.password);
      expect(repository.createLocalUser).toHaveBeenCalledWith({
        email: input.email,
        passwordHash: "scrypt$new-salt$new-key",
      });
    });

    it("rejects an email that is already registered", async () => {
      repository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(repository.createLocalUser).not.toHaveBeenCalled();
    });
  });

  describe("authenticate", () => {
    const input: LoginDto = {
      email: "user@example.com",
      password: "Correct Horse Battery Staple 42!",
    };

    it("returns the public user when the credentials are valid", async () => {
      repository.findByEmail.mockResolvedValue(existingUser);
      passwordHasher.verify.mockResolvedValue(true);

      await expect(service.authenticate(input)).resolves.toEqual({
        id: existingUser.id,
        email: existingUser.email,
      });
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        input.password,
        existingUser.passwordHash,
      );
    });

    it("returns the same generic error for an incorrect password", async () => {
      repository.findByEmail.mockResolvedValue(existingUser);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.authenticate(input)).rejects.toEqual(
        new UnauthorizedException("Invalid email or password"),
      );
    });

    it("returns the same generic error for an unknown email", async () => {
      repository.findByEmail.mockResolvedValue(null);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.authenticate(input)).rejects.toEqual(
        new UnauthorizedException("Invalid email or password"),
      );
      expect(passwordHasher.verify).toHaveBeenCalled();
    });

    it("rejects password login for an OAuth-only account", async () => {
      repository.findByEmail.mockResolvedValue({
        ...existingUser,
        passwordHash: null,
      });
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.authenticate(input)).rejects.toEqual(
        new UnauthorizedException("Invalid email or password"),
      );
    });
  });
});
