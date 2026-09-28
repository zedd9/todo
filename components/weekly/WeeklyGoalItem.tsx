"use client";

import { WeeklyGoalItem as WeeklyGoalItemType } from "@/store/weeklySlice";

interface WeeklyGoalItemProps {
  goal: WeeklyGoalItemType;
  index: number;
  onToggle: (index: number, done: boolean) => void;
}

export default function WeeklyGoalItem({ goal, index, onToggle }: WeeklyGoalItemProps) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink">
      <input
        type="checkbox"
        checked={goal.done}
        onChange={(event) => onToggle(index, event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      <span className={goal.done ? "text-muted-soft line-through" : ""}>{goal.text}</span>
    </label>
  );
}
