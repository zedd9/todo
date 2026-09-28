"use client";

import { WeeklyGoalItem as WeeklyGoalItemType } from "@/store/weeklySlice";

interface WeeklyGoalItemProps {
  goal: WeeklyGoalItemType;
  index: number;
  onToggle: (index: number, done: boolean) => void;
}

export default function WeeklyGoalItem({ goal, index, onToggle }: WeeklyGoalItemProps) {
  return (
    <label className="flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10">
      <input
        type="checkbox"
        checked={goal.done}
        onChange={(event) => onToggle(index, event.target.checked)}
        className="h-4 w-4"
      />
      <span className={goal.done ? "text-zinc-400 line-through dark:text-zinc-500" : ""}>
        {goal.text}
      </span>
    </label>
  );
}
