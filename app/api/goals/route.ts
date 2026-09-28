import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Goal from "@/models/Goal";
import { handleApiError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const goals = await Goal.find({ userId: sessionUser._id }).sort({ createdAt: -1 });
    return NextResponse.json(goals);
  } catch (error) {
    return handleApiError(error, "Failed to fetch goals");
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const goal = await Goal.create({
      // Always the session user: a client-supplied body.userId is ignored.
      userId: sessionUser._id,
      title: body.title,
      description: body.description,
      progress: body.progress,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create goal");
  }
}
