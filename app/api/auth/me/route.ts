import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      username: sessionUser.username,
      avatarUrl: sessionUser.avatarUrl,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch current user");
  }
}
