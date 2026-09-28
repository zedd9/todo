import { describe, it, expect } from "vitest";
import { computeGoalProgress, getGoalLinkedTodos } from "@/lib/goalProgress";

describe("computeGoalProgress", () => {
  it("returns 0 when the goal has no linked weekly plans", () => {
    const result = computeGoalProgress([], [], "goal-1");
    expect(result).toBe(0);
  });

  it("returns 0 when linked plans have zero todos", () => {
    const plans = [{ _id: "plan-1", goalId: "goal-1" }];
    const result = computeGoalProgress(plans, [], "goal-1");
    expect(result).toBe(0);
  });

  it("computes a weighted average across linked plans, ignoring unrelated plans/todos", () => {
    const plans = [
      { _id: "plan-1", goalId: "goal-1" },
      { _id: "plan-2", goalId: "goal-1" },
      { _id: "plan-3", goalId: "goal-2" }, // unrelated goal
    ];
    const todos = [
      // plan-1: 1/2 done = 50%
      { weeklyPlanId: "plan-1", status: "done" },
      { weeklyPlanId: "plan-1", status: "todo" },
      // plan-2: 2/2 done = 100%
      { weeklyPlanId: "plan-2", status: "done" },
      { weeklyPlanId: "plan-2", status: "done" },
      // plan-3: unrelated, should not affect goal-1's average
      { weeklyPlanId: "plan-3", status: "todo" },
    ];
    // average of (50%, 100%) = 75%
    const result = computeGoalProgress(plans, todos, "goal-1");
    expect(result).toBe(75);
  });
});

describe("getGoalLinkedTodos", () => {
  it("counts a todo linked via its weeklyPlan's goalId", () => {
    const plans = [{ _id: "plan-1", goalId: "goal-1" }];
    const todos = [{ weeklyPlanId: "plan-1", status: "todo" }];
    const result = getGoalLinkedTodos(plans, todos, "goal-1");
    expect(result).toHaveLength(1);
  });

  it("does NOT count a todo with only a stale/unused direct goalId, unless also linked via its weeklyPlan", () => {
    const plans = [{ _id: "plan-1", goalId: "goal-2" }]; // plan is linked to a different goal
    const todos = [
      // this todo has a stale direct goalId pointing at goal-1, but its weeklyPlan
      // (plan-1) is linked to goal-2, so it must NOT count toward goal-1
      { weeklyPlanId: "plan-1", status: "todo", goalId: "goal-1" },
    ];
    const result = getGoalLinkedTodos(plans, todos, "goal-1");
    expect(result).toHaveLength(0);
  });

  it("returns an empty array when the todo has no weeklyPlanId at all", () => {
    const plans = [{ _id: "plan-1", goalId: "goal-1" }];
    const todos = [{ status: "todo", goalId: "goal-1" }];
    const result = getGoalLinkedTodos(plans, todos, "goal-1");
    expect(result).toHaveLength(0);
  });
});
