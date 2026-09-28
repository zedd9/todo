import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

const COOKIE_PATH = "/";

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
  };
}

export function setStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    ...baseCookieOptions(),
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}

/** The OAuth state is single use, so every callback outcome clears it. */
export function clearStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...baseCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    expires: expiresAt,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...baseCookieOptions(),
    maxAge: 0,
  });
  return response;
}
