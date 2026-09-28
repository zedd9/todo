"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useStore from "@/store";
import { getWeekStart, isSameDay } from "@/lib/utils";
import WeeklyGoalItem from "@/components/weekly/WeeklyGoalItem";
import ProgressBar from "@/components/shared/ProgressBar";
import { getGoalLinkedTodos } from "@/lib/goalProgress";
import { redirectToLoginOn401 } from "@/lib/authRedirect";

export default function Dashboard() {
  const plans = useStore((state) => state.weekly.items);
  const fetchWeeklyPlans = useStore((state) => state.fetchWeeklyPlans);
  const toggleGoal = useStore((state) => state.toggleGoal);

  const todos = useStore((state) => state.todos.items);
  const fetchTodos = useStore((state) => state.fetchTodos);

  const goals = useStore((state) => state.goals.items);
  const fetchGoals = useStore((state) => state.fetchGoals);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // This component only renders for an already-confirmed-logged-in user
    // (app/page.tsx gates on GET /api/auth/me first), so a 401 here means
    // the session expired mid-visit rather than "no session yet" — send the
    // user back through login instead of showing a broken dashboard.
    Promise.all([fetchWeeklyPlans(), fetchGoals()])
      .catch(redirectToLoginOn401)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchWeeklyPlans, fetchGoals]);

  const thisWeekStart = useMemo(() => getWeekStart(new Date()), []);

  const currentPlan = useMemo(
    () => plans.find((plan) => isSameDay(new Date(plan.weekStart), thisWeekStart)),
    [plans, thisWeekStart]
  );

  useEffect(() => {
    if (currentPlan) {
      fetchTodos({ weeklyPlanId: currentPlan._id }).catch(redirectToLoginOn401);
    }
  }, [currentPlan, fetchTodos]);

  const handleToggle = (index: number, done: boolean) => {
    if (!currentPlan) return;
    toggleGoal(currentPlan._id, index, done);
  };

  if (loading) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">불러오는 중...</p>;
  }

  if (!currentPlan) {
    return (
      <div className="flex flex-col items-start gap-3 rounded border border-black/10 p-6 dark:border-white/10">
        <h1 className="text-xl font-semibold">이번 주 계획이 없습니다</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          이번 주 주간 계획을 아직 만들지 않았어요. 먼저 주간 계획을 생성해주세요.
        </p>
        <Link
          href="/weekly"
          className="rounded bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          주간 계획 만들기
        </Link>
      </div>
    );
  }

  const statusCounts = {
    todo: todos.filter((todo) => todo.status === "todo").length,
    doing: todos.filter((todo) => todo.status === "doing").length,
    done: todos.filter((todo) => todo.status === "done").length,
  };
  const totalTodos = todos.length;
  const progress = totalTodos > 0 ? Math.round((statusCounts.done / totalTodos) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          {new Date(currentPlan.weekStart).toLocaleDateString("ko-KR")} 주 대시보드
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">이번 주 현황 한눈에 보기</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">주간 목표</h2>
        {currentPlan.goals.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">등록된 목표가 없습니다.</p>
        ) : (
          currentPlan.goals.map((goal, index) => (
            <WeeklyGoalItem key={index} goal={goal} index={index} onToggle={handleToggle} />
          ))
        )}
      </div>

      {currentPlan.memo && (
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">메모</h2>
          <p className="rounded border border-black/10 px-3 py-2 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            {currentPlan.memo}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">할일 현황</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded border border-black/10 px-3 py-2 text-center dark:border-white/10">
            <p className="text-2xl font-semibold">{statusCounts.todo}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">할일</p>
          </div>
          <div className="rounded border border-black/10 px-3 py-2 text-center dark:border-white/10">
            <p className="text-2xl font-semibold">{statusCounts.doing}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">진행중</p>
          </div>
          <div className="rounded border border-black/10 px-3 py-2 text-center dark:border-white/10">
            <p className="text-2xl font-semibold">{statusCounts.done}</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">완료</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <ProgressBar
          percent={progress}
          label={`주간 진행률 (${statusCounts.done}/${totalTodos})`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">목표별 이번 주 할일</h2>
        {goals.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">등록된 1년 목표가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {goals.map((goal) => {
              const count = getGoalLinkedTodos(plans, todos, goal._id).length;
              return (
                <li
                  key={goal._id}
                  className="flex items-center justify-between rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10"
                >
                  <span>{goal.title}</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{count}개</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
