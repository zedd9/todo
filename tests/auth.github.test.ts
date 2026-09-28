import { describe, it, expect, afterEach, vi } from "vitest";
import * as githubRoute from "@/app/auth/github/route";
import { OAUTH_STATE_COOKIE_NAME } from "@/lib/session";

const CLIENT_ID = "test-client-id";
const CALLBACK_URL = "http://localhost:3000/auth/github/callback";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /auth/github", () => {
  it("redirects to GitHub with client_id, redirect_uri, scope and state", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("GITHUB_CALLBACK_URL", CALLBACK_URL);

    const response = await githubRoute.GET();

    expect(response.status).toBe(302);

    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    expect(location?.startsWith("https://github.com/login/oauth/authorize")).toBe(
      true
    );

    const url = new URL(location as string);
    expect(url.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(CALLBACK_URL);
    expect(url.searchParams.get("scope")).toBe("read:user");

    const state = url.searchParams.get("state");
    expect(state).toMatch(/^[0-9a-f]{32}$/);

    const stateCookie = response.cookies.get(OAUTH_STATE_COOKIE_NAME);
    expect(stateCookie?.value).toBe(state);
    expect(stateCookie?.httpOnly).toBe(true);
    expect(stateCookie?.sameSite).toBe("lax");
  });

  it("uses a fresh state on every request", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("GITHUB_CALLBACK_URL", CALLBACK_URL);

    const first = await githubRoute.GET();
    const second = await githubRoute.GET();

    expect(first.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value).not.toBe(
      second.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value
    );
  });

  it("returns 500 when GITHUB_CLIENT_ID is missing", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CALLBACK_URL", CALLBACK_URL);

    const response = await githubRoute.GET();

    expect(response.status).toBe(500);
    expect(response.headers.get("location")).toBeNull();
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("returns 500 when GITHUB_CALLBACK_URL is missing", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("GITHUB_CALLBACK_URL", "");

    const response = await githubRoute.GET();

    expect(response.status).toBe(500);
  });
});
