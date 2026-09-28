import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { setStateCookie } from "@/lib/authCookies";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return NextResponse.json(
      {
        error:
          "GitHub OAuth is not configured: GITHUB_CLIENT_ID and GITHUB_CALLBACK_URL are required",
      },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);

  return setStateCookie(NextResponse.redirect(authorizeUrl, 302), state);
}
