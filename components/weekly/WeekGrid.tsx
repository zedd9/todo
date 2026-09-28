"use client";

import { useEffect, useState } from "react";
import { TodoItem } from "@/store/todoSlice";

interface WeekGridProps {
  weeklyPlanId: string;
}

const DAYS: { label: string; value: number }[] = [
  { label: "월", value: 1 },
  { label: "화", value: 2 },
  { label: "수", value: 3 },
  { label: "목", value: 4 },
  { label: "금", value: 5 },
  { label: "토", value: 6 },
  { label: "일", value: 0 },
];

export default function WeekGrid({ weeklyPlanId }: WeekGridProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loadedPlanId, setLoadedPlanId] = useState<string | null>(null);
  // Derived instead of an effect-set flag: the grid is loading until the todos
  // in state belong to the plan currently being rendered.
  const loading = loadedPlanId !== weeklyPlanId;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/todos?weeklyPlanId=${weeklyPlanId}`);
      if (cancelled) return;
      if (res.ok) {
        const items: TodoItem[] = await res.json();
        if (cancelled) return;
        setTodos(items);
      }
      setLoadedPlanId(weeklyPlanId);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [weeklyPlanId]);

  const assignDay = async (todo: TodoItem, dayOfWeek: number | undefined) => {
    const res = await fetch(`/api/todos/${todo._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: todo.title,
        description: todo.description,
        status: todo.status,
        priority: todo.priority,
        dueDate: todo.dueDate,
        dayOfWeek,
        order: todo.order,
        weeklyPlanId: todo.weeklyPlanId,
        goalId: todo.goalId,
      }),
    });
    if (!res.ok) return;
    const updated: TodoItem = await res.json();
    setTodos((items) => items.map((item) => (item._id === updated._id ? updated : item)));
  };

  const unassigned = todos.filter((todo) => todo.dayOfWeek === undefined || todo.dayOfWeek === null);

  if (loading) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {unassigned.length > 0 && (
        <div className="flex flex-col gap-2 rounded border border-black/10 p-3 dark:border-white/10">
          <span className="text-sm font-medium">요일 미배정</span>
          {unassigned.map((todo) => (
            <div key={todo._id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{todo.title}</span>
              <select
                value=""
                onChange={(event) =>
                  assignDay(todo, event.target.value === "" ? undefined : Number(event.target.value))
                }
                className="rounded border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-zinc-800"
              >
                <option value="">배정</option>
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {DAYS.map((day) => {
          const dayTodos = todos.filter((todo) => todo.dayOfWeek === day.value);
          return (
            <div
              key={day.value}
              className="flex min-h-24 flex-col gap-2 rounded border border-black/10 p-2 dark:border-white/10"
            >
              <span className="text-sm font-semibold">{day.label}</span>
              {dayTodos.length === 0 ? (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">-</span>
              ) : (
                dayTodos.map((todo) => (
                  <div key={todo._id} className="flex flex-col gap-1 rounded bg-black/5 p-2 text-xs dark:bg-white/10">
                    <span className="truncate">{todo.title}</span>
                    <select
                      value={day.value}
                      onChange={(event) => assignDay(todo, Number(event.target.value))}
                      className="rounded border border-black/10 px-1 py-0.5 text-xs dark:border-white/10 dark:bg-zinc-800"
                    >
                      {DAYS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
