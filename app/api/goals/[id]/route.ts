import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Goal from "@/models/Goal";
import { handleApiError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Ownership is enforced by scoping every lookup to `{ _id, userId }`, so a
 * goal owned by somebody else falls into the same "not found" branch as one
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
    const goal = await Goal.findOne(ownedBy(id, sessionUser._id));
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    return handleApiError(error, "Failed to fetch goal");
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

    const goal = await Goal.findOneAndUpdate(
      ownedBy(id, sessionUser._id),
      {
        title: body.title,
        description: body.description,
        progress: body.progress,
      },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    return handleApiError(error, "Failed to update goal");
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
    const goal = await Goal.findOneAndDelete(ownedBy(id, sessionUser._id));
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete goal");
  }
}
