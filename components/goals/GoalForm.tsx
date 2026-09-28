"use client";

import { useState } from "react";
import useStore from "@/store";
import { GoalItem } from "@/store/goalSlice";

interface GoalFormProps {
  goal?: GoalItem;
  onDone: () => void;
}

export default function GoalForm({ goal, onDone }: GoalFormProps) {
  const addGoal = useStore((state) => state.addGoal);
  const updateGoal = useStore((state) => state.updateGoal);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      };
      if (goal) {
        await updateGoal(goal._id, data);
      } else {
        await addGoal(data);
      }
      onDone();
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="goal-title" className="text-caption text-ink">
          제목
        </label>
        <input
          id="goal-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink focus:border-2 focus:border-ink focus:outline-none"
          placeholder="목표 제목"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="goal-description" className="text-caption text-ink">
          설명
        </label>
        <textarea
          id="goal-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink focus:border-2 focus:border-ink focus:outline-none"
          placeholder="목표 설명 (선택)"
        />
      </div>

      {error && <p className="text-body-sm text-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-sm px-3 py-2 text-button-sm text-ink hover:bg-surface-soft"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-sm bg-primary px-3 py-2 text-button-sm text-on-primary hover:bg-primary-active disabled:opacity-50"
        >
          {goal ? "수정" : "생성"}
        </button>
      </div>
    </form>
  );
}
