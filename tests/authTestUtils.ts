import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { SESSION_COOKIE_NAME, createSession } from "@/lib/session";

export interface TestAuth {
  userId: string;
  cookie: string;
}

/** Creates a real User + Session in the in-memory DB and returns its cookie. */
export async function createTestAuth(
  githubId: string,
  username = `user-${githubId}`
): Promise<TestAuth> {
  await dbConnect();
  const user = await User.create({ githubId, username });
  const { token } = await createSession(String(user._id));
  return {
    userId: String(user._id),
    cookie: `${SESSION_COOKIE_NAME}=${token}`,
  };
}

/** Builds a NextRequest, attaching the session cookie when one is given. */
export function makeRequestWithCookie(
  url: string,
  cookie: string | undefined,
  init: RequestInit = {}
) {
  const headers = new Headers(init.headers);
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new NextRequest(new Request(url, { ...init, headers }));
}
