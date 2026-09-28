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
    <div className="flex items-start justify-between gap-4 rounded-md border border-hairline p-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-title-md text-ink">{goal.title}</h3>
        {goal.description && (
          <p className="mt-1 whitespace-pre-wrap text-body-sm text-body">{goal.description}</p>
        )}
        <div className="mt-3 max-w-xs">
          <GoalProgress goalId={goal._id} />
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label="수정"
          title="수정"
          className="flex h-8 w-8 items-center justify-center rounded-full text-body-sm hover:bg-surface-soft"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          aria-label="삭제"
          title="삭제"
          className="flex h-8 w-8 items-center justify-center rounded-full text-body-sm hover:bg-surface-soft"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
