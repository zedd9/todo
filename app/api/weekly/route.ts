import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WeeklyPlan from "@/models/WeeklyPlan";
import { handleApiError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");

    const filter: Record<string, unknown> = { userId: sessionUser._id };
    if (weekStart) {
      filter.weekStart = new Date(weekStart);
    }

    const plans = await WeeklyPlan.find(filter).sort({ weekStart: -1 });
    return NextResponse.json(plans);
  } catch (error) {
    return handleApiError(error, "Failed to fetch weekly plans");
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

    if (!body.weekStart) {
      return NextResponse.json(
        { error: "weekStart is required" },
        { status: 400 }
      );
    }

    const goals = Array.isArray(body.goals) ? body.goals.slice(0, 5) : [];

    const plan = await WeeklyPlan.create({
      // Always the session user: a client-supplied body.userId is ignored.
      userId: sessionUser._id,
      weekStart: new Date(body.weekStart),
      goals,
      memo: body.memo,
      retrospective: body.retrospective,
      goalId: body.goalId,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "A weekly plan for this weekStart already exists" },
        { status: 409 }
      );
    }

    return handleApiError(error, "Failed to create weekly plan");
  }
}
