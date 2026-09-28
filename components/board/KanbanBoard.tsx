"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import useStore from "@/store";
import { TodoItem } from "@/store/todoSlice";
import { resolveDrop, sortTodosByOrder } from "@/lib/kanban";
import { redirectToLoginOn401 } from "@/lib/authRedirect";
import KanbanColumn from "@/components/board/KanbanColumn";
import TodoCard from "@/components/board/TodoCard";

const COLUMNS: { status: TodoItem["status"]; title: string }[] = [
  { status: "todo", title: "할 일" },
  { status: "doing", title: "진행 중" },
  { status: "done", title: "완료" },
];

const STATUS_IDS = new Set<string>(COLUMNS.map((column) => column.status));

interface KanbanBoardProps {
  onCardClick?: (todo: TodoItem) => void;
}

export default function KanbanBoard({ onCardClick }: KanbanBoardProps) {
  const todos = useStore((state) => state.todos.items);
  const fetchTodos = useStore((state) => state.fetchTodos);
  const reorderTodo = useStore((state) => state.reorderTodo);

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos().catch(redirectToLoginOn401);
  }, [fetchTodos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columnTodos = useMemo(() => {
    const grouped: Record<TodoItem["status"], TodoItem[]> = {
      todo: [],
      doing: [],
      done: [],
    };
    for (const todo of todos) {
      grouped[todo.status].push(todo);
    }
    for (const status of Object.keys(grouped) as TodoItem["status"][]) {
      grouped[status] = sortTodosByOrder(grouped[status]);
    }
    return grouped;
  }, [todos]);

  const activeTodo = activeId ? todos.find((todo) => todo._id === activeId) : undefined;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const activeTodoItem = todos.find((todo) => todo._id === activeId);
    if (!activeTodoItem) return;

    const overId = String(over.id);
    const targetStatus: TodoItem["status"] = STATUS_IDS.has(overId)
      ? (overId as TodoItem["status"])
      : todos.find((todo) => todo._id === overId)?.status ?? activeTodoItem.status;

    const drop = resolveDrop(todos, activeId, overId, targetStatus);
    if (!drop) return;

    reorderTodo(activeId, drop.status, drop.order).catch(() => {
      // reorderTodo already rolls back local state on failure.
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            todos={columnTodos[column.status]}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTodo ? <TodoCard todo={activeTodo} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
