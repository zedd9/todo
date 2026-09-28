import crypto from "node:crypto";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";

/** Cookie holding the opaque session token. Shared by the auth route handlers. */
export const SESSION_COOKIE_NAME = "session_token";

/** Short-lived cookie holding the OAuth CSRF state value. */
export const OAUTH_STATE_COOKIE_NAME = "oauth_state";

/** Sessions live for 7 days. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** The OAuth state cookie only has to survive the round trip to GitHub. */
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

export interface SessionUser {
  _id: string;
  githubId: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Creates a Session document with a cryptographically random token. The caller
 * is responsible for putting the token on a cookie, which keeps this function
 * unit-testable without a Response object.
 */
export async function createSession(
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  await dbConnect();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await Session.create({ token, userId, expiresAt });

  return { token, expiresAt };
}

/**
 * Resolves the session cookie on a request to its User, or null when there is
 * no usable session. Expiry is checked explicitly rather than relying on the
 * Session TTL index: MongoDB sweeps expired documents on its own ~60s cycle, so
 * a request made just after expiry must still be treated as unauthenticated.
 * Stale documents found this way are deleted as a courtesy.
 */
export async function getSessionUser(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  await dbConnect();

  const session = await Session.findOne({ token });
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await Session.deleteOne({ _id: session._id });
    return null;
  }

  const user = await User.findById(session.userId);
  if (!user) {
    return null;
  }

  return {
    _id: String(user._id),
    githubId: user.githubId,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

/** Deletes the Session matching the token. No-op when nothing matches. */
export async function destroySession(token: string): Promise<void> {
  if (!token) {
    return;
  }

  await dbConnect();
  await Session.deleteOne({ token });
}
