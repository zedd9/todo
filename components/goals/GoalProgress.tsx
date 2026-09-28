"use client";

import useStore from "@/store";
import { computeGoalProgress } from "@/lib/goalProgress";
import ProgressBar from "@/components/shared/ProgressBar";

interface GoalProgressProps {
  goalId: string;
}

export default function GoalProgress({ goalId }: GoalProgressProps) {
  const weeklyPlans = useStore((state) => state.weekly.items);
  const todos = useStore((state) => state.todos.items);

  const progress = computeGoalProgress(weeklyPlans, todos, goalId);

  return <ProgressBar percent={progress} label="진행률" />;
}
