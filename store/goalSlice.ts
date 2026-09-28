import { StateCreator } from "zustand";
import { ApiError } from "@/lib/apiClientError";

export interface GoalItem {
  _id: string;
  title: string;
  description?: string;
  progress: number;
}

export interface GoalInput {
  title: string;
  description?: string;
}

export interface GoalSlice {
  goals: {
    items: GoalItem[];
  };
  fetchGoals: () => Promise<void>;
  addGoal: (data: GoalInput) => Promise<void>;
  updateGoal: (id: string, data: GoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const createGoalSlice: StateCreator<GoalSlice, [], [], GoalSlice> = (set) => ({
  goals: {
    items: [],
  },
  fetchGoals: async () => {
    const res = await fetch("/api/goals");
    if (!res.ok) {
      throw new ApiError("Failed to fetch goals", res.status);
    }
    const items: GoalItem[] = await res.json();
    set({ goals: { items } });
  },
  addGoal: async (data) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new ApiError("Failed to create goal", res.status);
    }
    const goal: GoalItem = await res.json();
    set((state) => ({
      goals: { items: [goal, ...state.goals.items] },
    }));
  },
  updateGoal: async (id, data) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new ApiError("Failed to update goal", res.status);
    }
    const goal: GoalItem = await res.json();
    set((state) => ({
      goals: {
        items: state.goals.items.map((item) => (item._id === id ? goal : item)),
      },
    }));
  },
  deleteGoal: async (id) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new ApiError("Failed to delete goal", res.status);
    }
    set((state) => ({
      goals: {
        items: state.goals.items.filter((item) => item._id !== id),
      },
    }));
  },
});
