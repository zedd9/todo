import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import * as callbackRoute from "@/app/auth/github/callback/route";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

const STATE = "state-abc123";

function makeRequest({
  code = "valid-code",
  state = STATE,
  stateCookie = STATE,
}: { code?: string | null; state?: string | null; stateCookie?: string | null } = {}) {
  const url = new URL("http://localhost/auth/github/callback");
  if (code !== null) url.searchParams.set("code", code);
  if (state !== null) url.searchParams.set("state", state);

  const headers: Record<string, string> = {};
  if (stateCookie !== null) {
    headers.cookie = `${OAUTH_STATE_COOKIE_NAME}=${stateCookie}`;
  }

  return new NextRequest(new Request(url, { headers }));
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Stubs global.fetch so the GitHub token and profile endpoints are never
 * really contacted. Returns the spy so tests can assert on the calls.
 */
function mockGitHub({
  tokenBody = { access_token: "gho_test_token" } as unknown,
  profileBody = {
    id: 987654,
    login: "octocat",
    avatar_url: "https://example.com/octocat.png",
  } as unknown,
  profileStatus = 200,
} = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url ?? String(input);

    if (url.startsWith("https://github.com/login/oauth/access_token")) {
      return jsonResponse(tokenBody);
    }
    if (url.startsWith("https://api.github.com/user")) {
      return jsonResponse(profileBody, profileStatus);
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
}

beforeEach(async () => {
  await dbConnect();
  vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv(
    "GITHUB_CALLBACK_URL",
    "http://localhost:3000/auth/github/callback"
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /auth/github/callback", () => {
  it("creates the user and session, sets the cookie and redirects to /", async () => {
    const fetchSpy = mockGitHub();

    const response = await callbackRoute.GET(makeRequest());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/");

    const user = await User.findOne({ githubId: "987654" });
    expect(user?.username).toBe("octocat");
    expect(user?.avatarUrl).toBe("https://example.com/octocat.png");

    const sessions = await Session.find();
    expect(sessions).toHaveLength(1);
    expect(String(sessions[0].userId)).toBe(String(user?._id));

    const sessionCookie = response.cookies.get(SESSION_COOKIE_NAME);
    expect(sessionCookie?.value).toBe(sessions[0].token);
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("lax");
    expect(new Date(sessionCookie?.expires as Date).getTime()).toBe(
      sessions[0].expiresAt.getTime()
    );

    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.maxAge).toBe(0);

    const tokenCall = fetchSpy.mock.calls.find((call) =>
      String(call[0]).includes("access_token")
    );
    expect(tokenCall?.[1]?.method).toBe("POST");
    const tokenBody = JSON.parse(String(tokenCall?.[1]?.body));
    expect(tokenBody.code).toBe("valid-code");
    expect(tokenBody.client_id).toBe("test-client-id");
    expect(tokenBody.client_secret).toBe("test-client-secret");

    const profileCall = fetchSpy.mock.calls.find((call) =>
      String(call[0]).includes("api.github.com/user")
    );
    const profileHeaders = profileCall?.[1]?.headers as Record<string, string>;
    expect(profileHeaders.Authorization).toBe("Bearer gho_test_token");
    expect(profileHeaders["User-Agent"]).toBeTruthy();
  });

  it("updates an existing user rather than creating a duplicate", async () => {
    mockGitHub();
    await User.create({
      githubId: "987654",
      username: "old-name",
      avatarUrl: "https://example.com/old.png",
    });

    const response = await callbackRoute.GET(makeRequest());

    expect(response.status).toBe(302);
    expect(await User.countDocuments()).toBe(1);

    const user = await User.findOne({ githubId: "987654" });
    expect(user?.username).toBe("octocat");
    expect(user?.avatarUrl).toBe("https://example.com/octocat.png");
  });

  it("returns 400 and creates no session when state does not match", async () => {
    const fetchSpy = mockGitHub();

    const response = await callbackRoute.GET(
      makeRequest({ state: "attacker-state" })
    );

    expect(response.status).toBe(400);
    expect(await Session.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.maxAge).toBe(0);
  });

  it("returns 400 and creates no session when the state cookie is missing", async () => {
    const fetchSpy = mockGitHub();

    const response = await callbackRoute.GET(makeRequest({ stateCookie: null }));

    expect(response.status).toBe(400);
    expect(await Session.countDocuments()).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns 400 when the code is missing", async () => {
    mockGitHub();

    const response = await callbackRoute.GET(makeRequest({ code: null }));

    expect(response.status).toBe(400);
    expect(await Session.countDocuments()).toBe(0);
  });

  it("returns 502 and creates no session when GitHub returns no access_token", async () => {
    mockGitHub({ tokenBody: { error: "bad_verification_code" } });

    const response = await callbackRoute.GET(makeRequest());

    expect(response.status).toBe(502);
    expect(await Session.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("returns 502 and creates no session when the profile request fails", async () => {
    mockGitHub({ profileBody: { message: "Bad credentials" }, profileStatus: 401 });

    const response = await callbackRoute.GET(makeRequest());

    expect(response.status).toBe(502);
    expect(await Session.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
  });

  it("returns 502 when the profile payload is incomplete", async () => {
    mockGitHub({ profileBody: { avatar_url: "https://example.com/x.png" } });

    const response = await callbackRoute.GET(makeRequest());

    expect(response.status).toBe(502);
    expect(await Session.countDocuments()).toBe(0);
  });
});
