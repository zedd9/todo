import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import WeeklyPlan from "@/models/WeeklyPlan";
import { handleApiError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Ownership is enforced by scoping every lookup to `{ _id, userId }`, so a
 * plan owned by somebody else falls into the same "not found" branch as one
 * that does not exist: non-owners get a 404 and learn nothing about whether
 * the id is real.
 */
function ownedBy(id: string, userId: string) {
  return { _id: id, userId };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const plan = await WeeklyPlan.findOne(ownedBy(id, sessionUser._id));
    if (!plan) {
      return NextResponse.json(
        { error: "Weekly plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    return handleApiError(error, "Failed to fetch weekly plan");
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const body = await request.json();

    const update: Record<string, unknown> = {
      memo: body.memo,
      retrospective: body.retrospective,
      goalId: body.goalId,
    };

    if (body.weekStart) {
      update.weekStart = new Date(body.weekStart);
    }
    if (Array.isArray(body.goals)) {
      update.goals = body.goals.slice(0, 5);
    }

    const plan = await WeeklyPlan.findOneAndUpdate(
      ownedBy(id, sessionUser._id),
      update,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return NextResponse.json(
        { error: "Weekly plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
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

    return handleApiError(error, "Failed to update weekly plan");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const body = await request.json();
    const { goalIndex, done } = body;

    if (
      typeof goalIndex !== "number" ||
      typeof done !== "boolean"
    ) {
      return NextResponse.json(
        { error: "goalIndex (number) and done (boolean) are required" },
        { status: 400 }
      );
    }

    const plan = await WeeklyPlan.findOne(ownedBy(id, sessionUser._id));
    if (!plan) {
      return NextResponse.json(
        { error: "Weekly plan not found" },
        { status: 404 }
      );
    }

    if (!plan.goals[goalIndex]) {
      return NextResponse.json(
        { error: "goalIndex out of range" },
        { status: 400 }
      );
    }

    plan.goals[goalIndex].done = done;
    await plan.save();

    return NextResponse.json(plan.goals[goalIndex]);
  } catch (error) {
    return handleApiError(error, "Failed to update weekly plan goal");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const plan = await WeeklyPlan.findOneAndDelete(ownedBy(id, sessionUser._id));
    if (!plan) {
      return NextResponse.json(
        { error: "Weekly plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete weekly plan");
  }
}
