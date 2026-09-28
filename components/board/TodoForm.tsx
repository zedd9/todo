"use client";

import { useEffect, useState } from "react";
import useStore from "@/store";
import { TodoItem } from "@/store/todoSlice";

interface TodoFormProps {
  todo?: TodoItem;
  onDone: () => void;
  onCancel: () => void;
}

export default function TodoForm({ todo, onDone, onCancel }: TodoFormProps) {
  const weeklyPlans = useStore((state) => state.weekly.items);
  const fetchWeeklyPlans = useStore((state) => state.fetchWeeklyPlans);
  const addTodo = useStore((state) => state.addTodo);
  const updateTodo = useStore((state) => state.updateTodo);
  const deleteTodo = useStore((state) => state.deleteTodo);

  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [weeklyPlanId, setWeeklyPlanId] = useState(todo?.weeklyPlanId ?? "");
  const [priority, setPriority] = useState(todo?.priority ?? "");
  const [dueDate, setDueDate] = useState(todo?.dueDate ? todo.dueDate.slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWeeklyPlans();
  }, [fetchWeeklyPlans]);

  const selectedPlan = weeklyPlans.find((plan) => plan._id === weeklyPlanId);
  const planGoalTexts = selectedPlan
    ? Array.from(new Set(selectedPlan.goals.map((goal) => goal.text).filter((text) => text.trim().length > 0)))
    : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("제목을 입력해주세요.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const data = {
        title: trimmedTitle,
        description: description.trim() || undefined,
        weeklyPlanId: weeklyPlanId || undefined,
        priority: (priority || undefined) as TodoItem["priority"] | undefined,
        dueDate: dueDate || undefined,
      };
      if (todo) {
        await updateTodo(todo._id, { ...data, status: todo.status, order: todo.order });
      } else {
        await addTodo(data);
      }
      onDone();
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    if (!confirm("이 할 일을 삭제할까요?")) return;
    setDeleting(true);
    try {
      await deleteTodo(todo._id);
      onDone();
    } catch {
      setError("삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="todo-title" className="text-sm font-medium">
          제목
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
          placeholder="할 일 제목"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="todo-description" className="text-sm font-medium">
          설명
        </label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-20 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
          placeholder="설명 (선택)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="todo-weekly" className="text-sm font-medium">
          주간 계획
        </label>
        <select
          id="todo-weekly"
          value={weeklyPlanId}
          onChange={(event) => setWeeklyPlanId(event.target.value)}
          className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
        >
          <option value="">연결 안 함</option>
          {weeklyPlans.map((plan) => (
            <option key={plan._id} value={plan._id}>
              {new Date(plan.weekStart).toLocaleDateString("ko-KR")} 주
            </option>
          ))}
        </select>
        {planGoalTexts.length > 0 && (
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              이 주의 목표에서 제목 가져오기
            </span>
            <div className="flex flex-wrap gap-2">
              {planGoalTexts.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setTitle(text)}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="todo-priority" className="text-sm font-medium">
          우선순위
        </label>
        <select
          id="todo-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as TodoItem["priority"] | "")}
          className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
        >
          <option value="">설정 안 함</option>
          <option value="high">상</option>
          <option value="medium">중</option>
          <option value="low">하</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="todo-due-date" className="text-sm font-medium">
          마감일
        </label>
        <input
          id="todo-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        {todo ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
          >
            삭제
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {todo ? "수정" : "생성"}
          </button>
        </div>
      </div>
    </form>
  );
}
