import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { PasswordHasher } from "./password/password-hasher";
import {
  AUTH_USER_REPOSITORY,
  AuthUser,
  AuthUserRepository,
} from "./users/auth-user.repository";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

// Estructura válida con 16 bytes de sal y 64 bytes de clave.
// Se utiliza cuando el usuario no existe para realizar el mismo trabajo criptográfico.
const DUMMY_PASSWORD_HASH =
  "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" +
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export type PublicAuthUser = Pick<AuthUser, "id" | "email">;

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly users: AuthUserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(input: RegisterDto): Promise<PublicAuthUser> {
    const existingUser = await this.users.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.createLocalUser({
      email: input.email,
      passwordHash,
    });

    return this.toPublicUser(user);
  }

  async authenticate(input: LoginDto): Promise<PublicAuthUser> {
    const user = await this.users.findByEmail(input.email);
    const storedHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordIsValid = await this.passwordHasher.verify(
      input.password,
      storedHash,
    );

    if (!user || !user.passwordHash || !passwordIsValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.toPublicUser(user);
  }

  async getCurrentUser(userId: string): Promise<PublicAuthUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    return this.toPublicUser(user);
  }

  private toPublicUser(user: AuthUser): PublicAuthUser {
    return {
      id: user.id,
      email: user.email,
    };
  }
}
