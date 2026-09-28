import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { generateOrderKey } from "@/lib/fractionalIndex";
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
    const status = searchParams.get("status");
    const weeklyPlanId = searchParams.get("weeklyPlanId");
    const goalId = searchParams.get("goalId");

    // userId is applied unconditionally so no query-param combination can widen
    // the result set beyond the session user's own todos.
    const filter: Record<string, unknown> = { userId: sessionUser._id };
    if (status) filter.status = status;
    if (weeklyPlanId) filter.weeklyPlanId = weeklyPlanId;
    if (goalId) filter.goalId = goalId;

    const todos = await Todo.find(filter).sort({ status: 1, order: 1 });
    return NextResponse.json(todos);
  } catch (error) {
    return handleApiError(error, "Failed to fetch todos");
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

    let order = body.order;
    if (!order) {
      const status = body.status ?? "todo";
      const last = await Todo.findOne({ userId: sessionUser._id, status }).sort({
        order: -1,
      });
      order = generateOrderKey(last?.order ?? null, null);
    }

    const todo = await Todo.create({
      // Always the session user: a client-supplied body.userId is ignored.
      userId: sessionUser._id,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate,
      dayOfWeek: body.dayOfWeek,
      order,
      weeklyPlanId: body.weeklyPlanId,
      goalId: body.goalId,
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create todo");
  }
}
