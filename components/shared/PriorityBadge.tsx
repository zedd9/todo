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
  high: "bg-primary-disabled text-error",
  medium: "bg-surface-strong text-body",
  low: "bg-surface-soft text-muted",
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`text-badge inline-flex items-center rounded-full px-2 py-0.5 ${PRIORITY_STYLE[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
