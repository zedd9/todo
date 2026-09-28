import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  destroySession,
  getSessionUser,
} from "@/lib/session";

function requestWithToken(token?: string) {
  const headers: Record<string, string> = {};
  if (token !== undefined) {
    headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  }
  return new NextRequest(new Request("http://localhost/api/todos", { headers }));
}

async function makeUser() {
  await dbConnect();
  return User.create({
    githubId: "12345",
    username: "octocat",
    avatarUrl: "https://example.com/octocat.png",
  });
}

describe("lib/session", () => {
  it("createSession stores a Session with a 7 day expiry window", async () => {
    const user = await makeUser();
    const before = Date.now();

    const { token, expiresAt } = await createSession(String(user._id));

    expect(token).toMatch(/^[0-9a-f]{64}$/);

    const stored = await Session.findOne({ token });
    expect(stored).not.toBeNull();
    expect(String(stored?.userId)).toBe(String(user._id));

    const expectedMs = SESSION_MAX_AGE_SECONDS * 1000;
    const actualMs = expiresAt.getTime() - before;
    expect(actualMs).toBeGreaterThanOrEqual(expectedMs - 5000);
    expect(actualMs).toBeLessThanOrEqual(expectedMs + 5000);
    expect(stored?.expiresAt.getTime()).toBe(expiresAt.getTime());
  });

  it("createSession issues a distinct token each call", async () => {
    const user = await makeUser();
    const first = await createSession(String(user._id));
    const second = await createSession(String(user._id));
    expect(first.token).not.toBe(second.token);
  });

  it("getSessionUser returns null when no cookie is present", async () => {
    expect(await getSessionUser(requestWithToken())).toBeNull();
  });

  it("getSessionUser returns null for a bogus token", async () => {
    expect(await getSessionUser(requestWithToken("not-a-real-token"))).toBeNull();
  });

  it("getSessionUser returns null and deletes the doc for an expired token", async () => {
    const user = await makeUser();
    const token = "expired-token";
    await Session.create({
      token,
      userId: user._id,
      expiresAt: new Date(Date.now() - 1000),
    });

    expect(await getSessionUser(requestWithToken(token))).toBeNull();
    expect(await Session.findOne({ token })).toBeNull();
  });

  it("getSessionUser returns the user shape for a valid token", async () => {
    const user = await makeUser();
    const { token } = await createSession(String(user._id));

    const sessionUser = await getSessionUser(requestWithToken(token));

    expect(sessionUser).toEqual({
      _id: String(user._id),
      githubId: "12345",
      username: "octocat",
      avatarUrl: "https://example.com/octocat.png",
    });
  });

  it("getSessionUser returns null when the user was deleted", async () => {
    const user = await makeUser();
    const { token } = await createSession(String(user._id));
    await User.deleteOne({ _id: user._id });

    expect(await getSessionUser(requestWithToken(token))).toBeNull();
  });

  it("destroySession removes the doc and is safe to repeat", async () => {
    const user = await makeUser();
    const { token } = await createSession(String(user._id));

    await destroySession(token);
    expect(await Session.findOne({ token })).toBeNull();
    expect(await Session.countDocuments()).toBe(0);

    await expect(destroySession(token)).resolves.toBeUndefined();
    await expect(destroySession("never-existed")).resolves.toBeUndefined();
  });
});
