"use client";

import { useEffect, useState } from "react";
import useStore from "@/store";
import { GoalItem } from "@/store/goalSlice";
import Modal from "@/components/shared/Modal";
import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";
import { redirectToLoginOn401 } from "@/lib/authRedirect";

export default function GoalsPage() {
  const goals = useStore((state) => state.goals.items);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const fetchWeeklyPlans = useStore((state) => state.fetchWeeklyPlans);
  const fetchTodos = useStore((state) => state.fetchTodos);
  const deleteGoal = useStore((state) => state.deleteGoal);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | undefined>(undefined);

  useEffect(() => {
    Promise.all([fetchGoals(), fetchWeeklyPlans(), fetchTodos()]).catch(
      redirectToLoginOn401
    );
  }, [fetchGoals, fetchWeeklyPlans, fetchTodos]);

  const openCreateModal = () => {
    setEditingGoal(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: GoalItem) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(undefined);
  };

  const handleDelete = async (goal: GoalItem) => {
    const confirmed = window.confirm(`"${goal.title}" 목표를 삭제하시겠습니까?`);
    if (!confirmed) return;
    await deleteGoal(goal._id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-display-sm text-ink">1년 목표</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-sm bg-primary px-3 py-2 text-button-sm text-on-primary hover:bg-primary-active"
        >
          새 목표
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-body-sm text-muted">아직 등록된 목표가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? "목표 수정" : "새 목표"}
      >
        <GoalForm goal={editingGoal} onDone={closeModal} />
      </Modal>
    </div>
  );
}
