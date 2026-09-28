"use client";

import { useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import TodoCard from "@/components/board/TodoCard";
import { TodoItem } from "@/store/todoSlice";
import { sortTodosByOrder } from "@/lib/kanban";

interface KanbanColumnProps {
  status: TodoItem["status"];
  title: string;
  todos: TodoItem[];
  onCardClick?: (todo: TodoItem) => void;
}

export default function KanbanColumn({ status, title, todos, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  const sortedTodos = useMemo(() => sortTodosByOrder(todos), [todos]);

  return (
    <div
      ref={setNodeRef}
      className="flex min-h-64 flex-1 flex-col gap-2 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{sortedTodos.length}</span>
      </div>

      <SortableContext
        items={sortedTodos.map((todo) => todo._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {sortedTodos.map((todo) => (
            <TodoCard key={todo._id} todo={todo} onClick={onCardClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
