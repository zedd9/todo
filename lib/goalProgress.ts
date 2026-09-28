export interface WeeklyPlanLike {
  _id: string;
  goalId?: string;
}

export interface TodoLike {
  weeklyPlanId?: string;
  status: string;
}

/**
 * The Todo -> WeeklyPlan -> Goal hierarchy is the single source of truth for
 * "which todos are linked to a goal": a todo is linked to a goal only via the
 * WeeklyPlan it belongs to (todo.weeklyPlanId -> plan.goalId), never via a
 * todo's own (possibly stale/unused) goalId field.
 */
function getLinkedWeeklyPlans<P extends WeeklyPlanLike>(weeklyPlans: P[], goalId: string): P[] {
  return weeklyPlans.filter((plan) => plan.goalId === goalId);
}

/**
 * Returns the todos linked to a goal, i.e. todos whose weeklyPlanId points to
 * a WeeklyPlan whose goalId is this goal. Shared by the dashboard and
 * GoalProgress so both agree on what counts as "linked".
 */
export function getGoalLinkedTodos<P extends WeeklyPlanLike, T extends TodoLike>(
  weeklyPlans: P[],
  todos: T[],
  goalId: string
): T[] {
  const linkedPlanIds = new Set(getLinkedWeeklyPlans(weeklyPlans, goalId).map((plan) => plan._id));
  return todos.filter((todo) => todo.weeklyPlanId !== undefined && linkedPlanIds.has(todo.weeklyPlanId));
}

/**
 * Compute a Goal's progress (0-100) as the average, across all WeeklyPlans
 * linked to the goal, of (done todos / total todos) for that plan.
 * - A goal with no linked weekly plans has 0% progress.
 * - A linked plan with zero todos contributes 0% to the average.
 */
export function computeGoalProgress(
  weeklyPlans: WeeklyPlanLike[],
  todos: TodoLike[],
  goalId: string
): number {
  const linkedPlans = getLinkedWeeklyPlans(weeklyPlans, goalId);
  if (linkedPlans.length === 0) return 0;

  const ratios = linkedPlans.map((plan) => {
    const planTodos = todos.filter((todo) => todo.weeklyPlanId === plan._id);
    if (planTodos.length === 0) return 0;
    const done = planTodos.filter((todo) => todo.status === "done").length;
    return done / planTodos.length;
  });

  const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  return Math.round(average * 100);
}
