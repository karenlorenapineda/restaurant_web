import { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "picasso_session";

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: true,
};
