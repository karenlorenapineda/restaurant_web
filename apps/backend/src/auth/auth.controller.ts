import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
  Req,
  Res,
  Get,
} from "@nestjs/common";
import { Request, Response } from "express";

import {
  AuthenticatedRequest,
  SessionAuthGuard,
} from "./guard/session-auth.guard";

import { AuthService, PublicAuthUser } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthSessionService } from "./session/auth-session.service";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./session/session-cookie";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: AuthSessionService,
  ) {}

  @Post("register")
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicAuthUser> {
    const user = await this.auth.register(input);

    await this.createSessionCookie(user.id, response);

    return user;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicAuthUser> {
    const user = await this.auth.authenticate(input);

    await this.createSessionCookie(user.id, response);

    return user;
  }

  @Get("me")
  @UseGuards(SessionAuthGuard)
  async me(@Req() request: AuthenticatedRequest): Promise<PublicAuthUser> {
    return this.auth.getCurrentUser(request.auth.userId);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token: unknown = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token === "string" && token.length > 0) {
      await this.sessions.revoke(token);
    }

    response.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  }

  private async createSessionCookie(
    userId: string,
    response: Response,
  ): Promise<void> {
    const session = await this.sessions.createForUser(userId);

    response.cookie(SESSION_COOKIE_NAME, session.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: session.expiresAt,
    });
  }
}
