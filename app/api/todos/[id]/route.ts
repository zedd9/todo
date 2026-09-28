import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { handleApiError } from "@/lib/apiError";
import { getSessionUser } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Ownership is enforced by scoping every lookup to `{ _id, userId }`, so a todo
 * owned by somebody else falls into the same "not found" branch as one that
 * does not exist: non-owners get a 404 and learn nothing about whether the id
 * is real.
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
    const todo = await Todo.findOne(ownedBy(id, sessionUser._id));
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    return handleApiError(error, "Failed to fetch todo");
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

    const todo = await Todo.findOneAndUpdate(
      ownedBy(id, sessionUser._id),
      {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate,
        dayOfWeek: body.dayOfWeek,
        order: body.order,
        weeklyPlanId: body.weeklyPlanId,
        goalId: body.goalId,
      },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    return handleApiError(error, "Failed to update todo");
  }
}

const PATCH_ALLOWED_FIELDS = ["status", "order"] as const;

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

    const rejectedFields = Object.keys(body).filter(
      (key) => !(PATCH_ALLOWED_FIELDS as readonly string[]).includes(key)
    );
    if (rejectedFields.length > 0) {
      return NextResponse.json(
        {
          error: `PATCH only accepts ${PATCH_ALLOWED_FIELDS.join(", ")}. Rejected field(s): ${rejectedFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.order !== undefined) update.order = body.order;

    const todo = await Todo.findOneAndUpdate(ownedBy(id, sessionUser._id), update, {
      new: true,
      runValidators: true,
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    return handleApiError(error, "Failed to update todo");
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
    const todo = await Todo.findOneAndDelete(ownedBy(id, sessionUser._id));
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete todo");
  }
}
