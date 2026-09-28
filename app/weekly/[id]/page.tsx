"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useStore from "@/store";
import WeeklyGoalItem from "@/components/weekly/WeeklyGoalItem";
import WeeklyPlanForm from "@/components/weekly/WeeklyPlanForm";
import WeekGrid from "@/components/weekly/WeekGrid";
import ProgressBar from "@/components/shared/ProgressBar";
import Modal from "@/components/shared/Modal";
import { redirectToLoginOn401 } from "@/lib/authRedirect";

export default function WeeklyPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const plans = useStore((state) => state.weekly.items);
  const fetchWeeklyPlans = useStore((state) => state.fetchWeeklyPlans);
  const toggleGoal = useStore((state) => state.toggleGoal);
  const updateWeeklyPlan = useStore((state) => state.updateWeeklyPlan);
  const deleteWeeklyPlan = useStore((state) => state.deleteWeeklyPlan);

  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // `null` means "untouched": the textarea then mirrors the loaded plan.
  const [memoDraft, setMemoDraft] = useState<string | null>(null);
  const [retrospectiveDraft, setRetrospectiveDraft] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyPlans()
      .catch(redirectToLoginOn401)
      .finally(() => setLoading(false));
  }, [fetchWeeklyPlans]);

  const plan = useMemo(() => plans.find((item) => item._id === id), [plans, id]);

  const memo = memoDraft ?? plan?.memo ?? "";
  const retrospective = retrospectiveDraft ?? plan?.retrospective ?? "";

  const handleToggle = (index: number, done: boolean) => {
    if (!plan) return;
    toggleGoal(plan._id, index, done);
  };

  const handleMemoBlur = () => {
    if (!plan) return;
    if (memo === (plan.memo ?? "")) return;
    updateWeeklyPlan(plan._id, {
      weekStart: plan.weekStart,
      goals: plan.goals,
      memo,
      retrospective: plan.retrospective,
      goalId: plan.goalId,
    });
  };

  const handleRetrospectiveBlur = () => {
    if (!plan) return;
    if (retrospective === (plan.retrospective ?? "")) return;
    updateWeeklyPlan(plan._id, {
      weekStart: plan.weekStart,
      goals: plan.goals,
      memo: plan.memo,
      retrospective,
      goalId: plan.goalId,
    });
  };

  if (loading) {
    return <p className="text-body-sm text-muted">불러오는 중...</p>;
  }

  if (!plan) {
    return <p className="text-body-sm text-muted">주간 계획을 찾을 수 없습니다.</p>;
  }

  const handleDelete = async () => {
    if (!confirm("이 주간 계획을 삭제할까요?")) return;
    setDeleting(true);
    try {
      await deleteWeeklyPlan(plan._id);
      router.push("/weekly");
    } catch {
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  };

  const doneCount = plan.goals.filter((goal) => goal.done).length;
  const progress = plan.goals.length > 0 ? Math.round((doneCount / plan.goals.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display-sm text-ink">
          {new Date(plan.weekStart).toLocaleDateString("ko-KR")} 주 계획
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded-sm px-3 py-2 text-button-sm text-ink hover:bg-surface-soft"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-sm px-3 py-2 text-button-sm text-error hover:bg-primary-disabled disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>

      <ProgressBar percent={progress} label={`주간 목표 진행률 (${doneCount}/${plan.goals.length})`} />

      <div className="flex flex-col gap-2">
        <h2 className="text-title-sm text-ink">주간 목표</h2>
        {plan.goals.length === 0 ? (
          <p className="text-body-sm text-muted">등록된 목표가 없습니다.</p>
        ) : (
          plan.goals.map((goal, index) => (
            <WeeklyGoalItem key={index} goal={goal} index={index} onToggle={handleToggle} />
          ))
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="plan-memo" className="text-title-sm text-ink">
          메모
        </label>
        <textarea
          id="plan-memo"
          value={memo}
          onChange={(event) => setMemoDraft(event.target.value)}
          onBlur={handleMemoBlur}
          className="min-h-24 rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink focus:border-2 focus:border-ink focus:outline-none"
          placeholder="이번 주 메모"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-title-sm text-ink">요일별 할일</h2>
        <WeekGrid weeklyPlanId={plan._id} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="plan-retrospective" className="text-title-sm text-ink">
          주간 회고
        </label>
        <textarea
          id="plan-retrospective"
          value={retrospective}
          onChange={(event) => setRetrospectiveDraft(event.target.value)}
          onBlur={handleRetrospectiveBlur}
          className="min-h-24 rounded-sm border border-hairline px-3 py-2 text-body-sm text-ink focus:border-2 focus:border-ink focus:outline-none"
          placeholder="이번 주를 돌아보며..."
        />
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="주간 계획 수정">
        <WeeklyPlanForm
          plan={plan}
          onDone={() => setIsEditOpen(false)}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>
    </div>
  );
}
