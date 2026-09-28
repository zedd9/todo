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
      className="flex cursor-grab flex-col gap-1 rounded-lg border border-black/10 bg-white p-3 text-sm shadow-sm active:cursor-grabbing dark:border-white/10 dark:bg-zinc-900"
    >
      <span className="font-medium">{todo.title}</span>
      {(todo.priority || todo.dueDate) && (
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          {todo.priority && <PriorityBadge priority={todo.priority} />}
          {todo.dueDate && (
            <span
              className={
                isOverdue(todo.dueDate, todo.status)
                  ? "font-semibold text-red-600 dark:text-red-400"
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
