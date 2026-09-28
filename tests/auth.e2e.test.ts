import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import * as githubRoute from "@/app/auth/github/route";
import * as callbackRoute from "@/app/auth/github/callback/route";
import * as logoutRoute from "@/app/auth/logout/route";
import * as meRoute from "@/app/api/auth/me/route";
import * as todosRoute from "@/app/api/todos/route";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";
import { OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/session";

const CLIENT_ID = "e2e-client-id";
const CLIENT_SECRET = "e2e-client-secret";
const CALLBACK_URL = "http://localhost:3000/auth/github/callback";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Stubs global.fetch so the token exchange + profile fetch never hit GitHub. */
function mockGitHub({
  tokenBody = { access_token: "gho_e2e_token" } as unknown,
  profileBody = {
    id: 555111,
    login: "e2e-octocat",
    avatar_url: "https://example.com/e2e-octocat.png",
  } as unknown,
} = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url ?? String(input);

    if (url.startsWith("https://github.com/login/oauth/access_token")) {
      return jsonResponse(tokenBody);
    }
    if (url.startsWith("https://api.github.com/user")) {
      return jsonResponse(profileBody);
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
}

function makeRequest(url: string, cookie?: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new NextRequest(new Request(url, { ...init, headers }));
}

beforeEach(async () => {
  await dbConnect();
  vi.stubEnv("GITHUB_CLIENT_ID", CLIENT_ID);
  vi.stubEnv("GITHUB_CLIENT_SECRET", CLIENT_SECRET);
  vi.stubEnv("GITHUB_CALLBACK_URL", CALLBACK_URL);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("full GitHub OAuth login -> todo -> logout flow", () => {
  it("chains /auth/github through logout with no real network call to GitHub", async () => {
    // 1. Hit /auth/github and grab the state + oauth cookie.
    const startResponse = await githubRoute.GET();
    expect(startResponse.status).toBe(302);
    const location = startResponse.headers.get("location");
    const state = new URL(location as string).searchParams.get("state");
    expect(state).toBeTruthy();
    const stateCookie = startResponse.cookies.get(OAUTH_STATE_COOKIE_NAME);
    expect(stateCookie?.value).toBe(state);

    // 2. Call the callback with matching state + mocked GitHub responses.
    const fetchSpy = mockGitHub();
    const callbackUrl = new URL(CALLBACK_URL);
    callbackUrl.searchParams.set("code", "valid-code");
    callbackUrl.searchParams.set("state", state as string);
    const callbackResponse = await callbackRoute.GET(
      new NextRequest(
        new Request(callbackUrl, {
          headers: { cookie: `${OAUTH_STATE_COOKIE_NAME}=${state}` },
        })
      )
    );
    expect(callbackResponse.status).toBe(302);
    expect(fetchSpy).toHaveBeenCalled();

    const user = await User.findOne({ githubId: "555111" });
    expect(user?.username).toBe("e2e-octocat");
    expect(user?.avatarUrl).toBe("https://example.com/e2e-octocat.png");

    const sessions = await Session.find();
    expect(sessions).toHaveLength(1);
    expect(String(sessions[0].userId)).toBe(String(user?._id));

    const sessionCookie = callbackResponse.cookies.get(SESSION_COOKIE_NAME);
    expect(sessionCookie?.value).toBe(sessions[0].token);
    const cookieHeader = `${SESSION_COOKIE_NAME}=${sessionCookie?.value}`;

    // 3. GET /api/auth/me with the session cookie.
    const meResponse = await meRoute.GET(
      makeRequest("http://localhost/api/auth/me", cookieHeader)
    );
    expect(meResponse.status).toBe(200);
    const meBody = await meResponse.json();
    expect(meBody.username).toBe("e2e-octocat");

    // 4. POST /api/todos with the session cookie.
    const createResponse = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", cookieHeader, {
        method: "POST",
        body: JSON.stringify({ title: "E2E todo" }),
      })
    );
    expect(createResponse.status).toBe(201);
    const createdTodo = await createResponse.json();
    expect(createdTodo.title).toBe("E2E todo");
    expect(String(createdTodo.userId)).toBe(String(user?._id));

    // 5. GET /api/todos with the session cookie shows the new todo.
    const listResponse = await todosRoute.GET(
      makeRequest("http://localhost/api/todos", cookieHeader)
    );
    expect(listResponse.status).toBe(200);
    const list = await listResponse.json();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("E2E todo");

    // 6. Logout deletes the Session document from the DB.
    const logoutResponse = await logoutRoute.GET(
      makeRequest("http://localhost/auth/logout", cookieHeader)
    );
    expect(logoutResponse.status).toBe(302);
    const sessionAfterLogout = await Session.findOne({
      token: sessionCookie?.value,
    });
    expect(sessionAfterLogout).toBeNull();

    // 7. The same (now-invalidated) session cookie is rejected.
    const rejectedResponse = await todosRoute.GET(
      makeRequest("http://localhost/api/todos", cookieHeader)
    );
    expect(rejectedResponse.status).toBe(401);
  });
});
