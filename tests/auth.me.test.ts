import { describe, it, expect, beforeEach } from "vitest";
import * as meRoute from "@/app/api/auth/me/route";
import {
  createTestAuth,
  makeRequestWithCookie,
  type TestAuth,
} from "./authTestUtils";

let auth: TestAuth;

beforeEach(async () => {
  auth = await createTestAuth("me-user", "octocat");
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a session cookie", async () => {
    const res = await meRoute.GET(
      makeRequestWithCookie("http://localhost/api/auth/me", undefined)
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with only username and avatarUrl for a valid session", async () => {
    const res = await meRoute.GET(
      makeRequestWithCookie("http://localhost/api/auth/me", auth.cookie)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // avatarUrl is undefined for this fixture user, and JSON.stringify drops
    // undefined-valued keys entirely, so only "username" survives the round trip.
    expect(body).toEqual({ username: "octocat" });
    expect(body).not.toHaveProperty("githubId");
    expect(body).not.toHaveProperty("_id");
  });
});
