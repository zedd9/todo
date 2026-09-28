"use client";

import { GoalItem } from "@/store/goalSlice";
import GoalProgress from "@/components/goals/GoalProgress";

interface GoalCardProps {
  goal: GoalItem;
  onEdit: (goal: GoalItem) => void;
  onDelete: (goal: GoalItem) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold">{goal.title}</h3>
        {goal.description && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
            {goal.description}
          </p>
        )}
        <div className="mt-3 max-w-xs">
          <GoalProgress goalId={goal._id} />
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label="수정"
          title="수정"
          className="rounded px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          aria-label="삭제"
          title="삭제"
          className="rounded px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
