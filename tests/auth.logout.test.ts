import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import * as logoutRoute from "@/app/auth/logout/route";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";
import { SESSION_COOKIE_NAME, createSession } from "@/lib/session";

function makeRequest(cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) {
    headers.cookie = cookie;
  }
  return new NextRequest(
    new Request("http://localhost/auth/logout", { headers })
  );
}

describe("GET /auth/logout", () => {
  it("deletes the session and clears the cookie", async () => {
    await dbConnect();
    const user = await User.create({ githubId: "42", username: "octocat" });
    const { token } = await createSession(String(user._id));
    expect(await Session.countDocuments()).toBe(1);

    const response = await logoutRoute.GET(
      makeRequest(`${SESSION_COOKIE_NAME}=${token}`)
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/auth/logged-out");
    expect(await Session.countDocuments()).toBe(0);

    const cleared = response.cookies.get(SESSION_COOKIE_NAME);
    expect(cleared?.value).toBe("");
    expect(cleared?.maxAge).toBe(0);
  });

  it("redirects cleanly with no session cookie", async () => {
    const response = await logoutRoute.GET(makeRequest());

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/auth/logged-out");
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.maxAge).toBe(0);
  });

  it("redirects cleanly with an unknown session token", async () => {
    const response = await logoutRoute.GET(
      makeRequest(`${SESSION_COOKIE_NAME}=unknown-token`)
    );

    expect(response.status).toBe(302);
    expect(await Session.countDocuments()).toBe(0);
  });
});
