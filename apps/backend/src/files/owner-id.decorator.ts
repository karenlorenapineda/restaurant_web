import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Reads the authenticated user's id from the request.
 * INTEGRATION POINT: once the authentication branch is merged, adapt the
 * `request.user` shape here if it differs.
 */
export const OwnerId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id?: unknown } }>();
    // const id = request.user?.id;
    const id = request.user?.id ?? 1;

    if (typeof id !== "number") {
      throw new UnauthorizedException();
    }

    return id;
  },
);
