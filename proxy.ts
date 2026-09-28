import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * UX convenience layer only: redirects browser navigations to any main app
 * page that has no session cookie at all straight to the GitHub login flow,
 * so users don't land on a broken/blank page. This is NOT the security
 * boundary — it only checks for the cookie's presence, not validity (no DB
 * lookup, to keep this fast/edge-friendly). The real enforcement (validating
 * the session and scoping data by owner) happens in the API routes
 * themselves, which already 401/404 as appropriate.
 *
 * Proxy defaults to the Node.js runtime as of Next.js 16, so lib/session.ts's
 * Node-only imports (node:crypto, mongoose) are fine here even though we only
 * use the cookie-name constant from it.
 *
 * "/" is intentionally NOT in the matcher: unlike the other routes, it needs
 * to show a real public landing page to logged-out visitors instead of an
 * instant redirect. It self-gates client-side (same GET /api/auth/me check
 * as Header.tsx) and renders the landing page or the dashboard accordingly.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/auth/github", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/todos/:path*", "/goals/:path*", "/weekly/:path*"],
};
