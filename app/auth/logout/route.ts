import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { clearSessionCookie } from "@/lib/authCookies";
import { SESSION_COOKIE_NAME, destroySession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await destroySession(token);
    }

    // Not "/": that page is behind the auth gate, so with the session cookie
    // just cleared it would immediately bounce back through /auth/github —
    // and silently re-authenticate if GitHub's own session is still active,
    // making logout look like it did nothing.
    const response = NextResponse.redirect(
      new URL("/auth/logged-out", request.nextUrl.origin),
      302
    );
    return clearSessionCookie(response);
  } catch (error) {
    return handleApiError(error, "Failed to log out");
  }
}
