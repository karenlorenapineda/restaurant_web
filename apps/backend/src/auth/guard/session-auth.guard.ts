import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

import { AuthSessionService } from "../session/auth-session.service";
import { SESSION_COOKIE_NAME } from "../session/session-cookie";

export interface RequestAuthentication {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: RequestAuthentication;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token !== "string" || token.length === 0) {
      throw new UnauthorizedException("Authentication required");
    }

    const userId = await this.sessions.resolveUserId(token);

    if (!userId) {
      throw new UnauthorizedException("Authentication required");
    }

    request.auth = { userId };

    return true;
  }
}
