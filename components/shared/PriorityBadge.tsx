import { TodoPriority } from "@/types";

interface PriorityBadgeProps {
  priority: TodoPriority;
}

const PRIORITY_LABEL: Record<TodoPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_STYLE: Record<TodoPriority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
