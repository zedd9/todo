"use client";

import { useEffect, useState } from "react";
import useStore from "@/store";
import { WeeklyActionResult, WeeklyGoalItem, WeeklyPlanItem } from "@/store/weeklySlice";
import { getWeekStart } from "@/lib/utils";

const MAX_GOALS = 5;

interface WeeklyPlanFormProps {
  plan?: WeeklyPlanItem;
  weekStart?: string;
  onDone: (result: WeeklyActionResult) => void;
  onCancel: () => void;
}

export default function WeeklyPlanForm({ plan, weekStart, onDone, onCancel }: WeeklyPlanFormProps) {
  const goals = useStore((state) => state.goals.items);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const addWeeklyPlan = useStore((state) => state.addWeeklyPlan);
  const updateWeeklyPlan = useStore((state) => state.updateWeeklyPlan);

  const [goalRows, setGoalRows] = useState<WeeklyGoalItem[]>(
    plan?.goals.length ? plan.goals : [{ text: "", done: false }]
  );
  const initialWeekStart = plan?.weekStart ?? weekStart ?? new Date().toISOString();
  const [weekStartDraft, setWeekStartDraft] = useState(
    initialWeekStart.slice(0, 10)
  );
  const [memo, setMemo] = useState(plan?.memo ?? "");
  const [goalId, setGoalId] = useState(plan?.goalId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const updateGoalText = (index: number, text: string) => {
    setGoalRows((rows) => rows.map((row, i) => (i === index ? { ...row, text } : row)));
  };

  const addGoalRow = () => {
    setGoalRows((rows) => (rows.length >= MAX_GOALS ? rows : [...rows, { text: "", done: false }]));
  };

  const removeGoalRow = (index: number) => {
    setGoalRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedGoals = goalRows
      .map((row) => ({ text: row.text.trim(), done: row.done }))
      .filter((row) => row.text.length > 0)
      .slice(0, MAX_GOALS);

    if (!weekStartDraft) {
      setError("주간 시작일을 선택해주세요.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const [year, month, day] = weekStartDraft.split("-").map(Number);
      const data = {
        weekStart: getWeekStart(new Date(year, month - 1, day)).toISOString(),
        goals: trimmedGoals,
        memo: memo.trim(),
        goalId: goalId || undefined,
      };

      const result = plan
        ? await updateWeeklyPlan(plan._id, data)
        : await addWeeklyPlan(data);

      if (!result.ok) {
        setError(result.error ?? "저장에 실패했습니다.");
        return;
      }

      onDone(result);
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="weekly-week-start" className="text-sm font-medium">
          주간 시작일
        </label>
        <input
          id="weekly-week-start"
          type="date"
          value={weekStartDraft}
          onChange={(event) => setWeekStartDraft(event.target.value)}
          className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
        />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          선택한 날짜가 속한 주의 월요일부터 시작합니다.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">주간 목표 (최대 {MAX_GOALS}개)</span>
        {goalRows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={row.text}
              onChange={(event) => updateGoalText(index, event.target.value)}
              className="flex-1 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
              placeholder={`목표 ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeGoalRow(index)}
              aria-label="삭제"
              className="rounded px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        ))}
        {goalRows.length < MAX_GOALS && (
          <button
            type="button"
            onClick={addGoalRow}
            className="self-start rounded px-2 py-1 text-sm text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
          >
            + 목표 추가
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="weekly-memo" className="text-sm font-medium">
          메모
        </label>
        <textarea
          id="weekly-memo"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          className="min-h-20 rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
          placeholder="메모 (선택)"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="weekly-goal" className="text-sm font-medium">
          연결된 1년 목표
        </label>
        <select
          id="weekly-goal"
          value={goalId}
          onChange={(event) => setGoalId(event.target.value)}
          className="rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-800"
        >
          <option value="">연결 안 함</option>
          {goals.map((goal) => (
            <option key={goal._id} value={goal._id}>
              {goal.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
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
          {plan ? "수정" : "생성"}
        </button>
      </div>
    </form>
  );
}
