import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { handleApiError } from "@/lib/apiError";
import {
  clearStateCookie,
  setSessionCookie,
} from "@/lib/authCookies";
import { OAUTH_STATE_COOKIE_NAME, createSession } from "@/lib/session";

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const USER_AGENT = "todo-app";

interface GitHubProfile {
  id?: number | string;
  login?: string;
  avatar_url?: string;
}

function errorResponse(message: string, status: number) {
  return clearStateCookie(NextResponse.json({ error: message }, { status }));
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

    if (!expectedState || !state || state !== expectedState) {
      return errorResponse("Invalid OAuth state", 400);
    }

    if (!code) {
      return errorResponse("Missing OAuth code", 400);
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      return errorResponse("GitHub OAuth is not configured", 500);
    }

    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenResponse
      .json()
      .catch(() => null as { access_token?: string } | null);
    const accessToken = tokenData?.access_token;

    if (!accessToken) {
      return errorResponse("Failed to exchange code for an access token", 502);
    }

    const profileResponse = await fetch(GITHUB_USER_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": USER_AGENT,
      },
    });

    if (!profileResponse.ok) {
      return errorResponse("Failed to fetch the GitHub profile", 502);
    }

    const profile = await profileResponse
      .json()
      .catch(() => null as GitHubProfile | null);

    if (profile?.id === undefined || !profile.login) {
      return errorResponse("GitHub profile response was incomplete", 502);
    }

    await dbConnect();

    const user = await User.findOneAndUpdate(
      { githubId: String(profile.id) },
      {
        githubId: String(profile.id),
        username: profile.login,
        avatarUrl: profile.avatar_url,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const { token, expiresAt } = await createSession(String(user._id));

    const response = NextResponse.redirect(
      new URL("/", request.nextUrl.origin),
      302
    );
    setSessionCookie(response, token, expiresAt);
    return clearStateCookie(response);
  } catch (error) {
    return handleApiError(error, "GitHub OAuth callback failed");
  }
}
