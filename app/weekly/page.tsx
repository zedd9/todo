"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useStore from "@/store";
import Modal from "@/components/shared/Modal";
import WeeklyPlanForm from "@/components/weekly/WeeklyPlanForm";
import { getWeekStart } from "@/lib/utils";
import { redirectToLoginOn401 } from "@/lib/authRedirect";

export default function WeeklyPage() {
  const plans = useStore((state) => state.weekly.items);
  const fetchWeeklyPlans = useStore((state) => state.fetchWeeklyPlans);
  const deleteWeeklyPlan = useStore((state) => state.deleteWeeklyPlan);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchWeeklyPlans().catch(redirectToLoginOn401);
  }, [fetchWeeklyPlans]);

  const recentPlans = useMemo(() => {
    return [...plans]
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
      .slice(0, 4);
  }, [plans]);

  const defaultWeekStart = useMemo(() => getWeekStart(new Date()).toISOString(), []);

  const handleDelete = async (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("이 주간 계획을 삭제할까요?")) return;
    try {
      await deleteWeeklyPlan(id);
    } catch {
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">주간 계획</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          새 주간 계획
        </button>
      </div>

      {recentPlans.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          아직 등록된 주간 계획이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recentPlans.map((plan) => {
            const doneCount = plan.goals.filter((goal) => goal.done).length;
            return (
              <Link
                key={plan._id}
                href={`/weekly/${plan._id}`}
                className="flex items-center justify-between rounded-lg border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <span className="font-medium">
                  {new Date(plan.weekStart).toLocaleDateString("ko-KR")} 주
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {doneCount}/{plan.goals.length} 완료
                  </span>
                  <button
                    type="button"
                    onClick={(event) => handleDelete(event, plan._id)}
                    aria-label="삭제"
                    className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="새 주간 계획">
        <WeeklyPlanForm
          weekStart={defaultWeekStart}
          onDone={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
