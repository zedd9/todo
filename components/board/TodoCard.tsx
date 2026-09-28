"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TodoItem } from "@/store/todoSlice";
import { isOverdue } from "@/lib/utils";
import PriorityBadge from "@/components/shared/PriorityBadge";

interface TodoCardProps {
  todo: TodoItem;
  onClick?: (todo: TodoItem) => void;
}

export default function TodoCard({ todo, onClick }: TodoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(todo)}
      className="flex cursor-grab flex-col gap-1 rounded-md border border-hairline bg-canvas p-3 text-body-sm transition-shadow hover:shadow-airbnb active:cursor-grabbing"
    >
      <span className="font-medium text-ink">{todo.title}</span>
      {(todo.priority || todo.dueDate) && (
        <div className="flex items-center gap-2 text-caption-sm text-muted">
          {todo.priority && <PriorityBadge priority={todo.priority} />}
          {todo.dueDate && (
            <span
              className={
                isOverdue(todo.dueDate, todo.status)
                  ? "font-semibold text-error"
                  : undefined
              }
            >
              {new Date(todo.dueDate).toLocaleDateString("ko-KR")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
