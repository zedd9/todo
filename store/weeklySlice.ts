import { StateCreator } from "zustand";
import { ApiError } from "@/lib/apiClientError";

export interface WeeklyGoalItem {
  text: string;
  done: boolean;
}

export interface WeeklyPlanItem {
  _id: string;
  weekStart: string;
  goals: WeeklyGoalItem[];
  memo: string;
  retrospective?: string;
  goalId?: string;
}

export interface WeeklyPlanInput {
  weekStart: string;
  goals?: WeeklyGoalItem[];
  memo?: string;
  retrospective?: string;
  goalId?: string;
}

export interface WeeklyActionResult {
  ok: boolean;
  error?: string;
  plan?: WeeklyPlanItem;
}

export interface WeeklySlice {
  weekly: {
    items: WeeklyPlanItem[];
  };
  fetchWeeklyPlans: () => Promise<void>;
  addWeeklyPlan: (data: WeeklyPlanInput) => Promise<WeeklyActionResult>;
  updateWeeklyPlan: (id: string, data: WeeklyPlanInput) => Promise<WeeklyActionResult>;
  deleteWeeklyPlan: (id: string) => Promise<void>;
  toggleGoal: (id: string, goalIndex: number, done: boolean) => Promise<void>;
}

export const createWeeklySlice: StateCreator<WeeklySlice, [], [], WeeklySlice> = (set) => ({
  weekly: {
    items: [],
  },
  fetchWeeklyPlans: async () => {
    const res = await fetch("/api/weekly");
    if (!res.ok) {
      throw new ApiError("Failed to fetch weekly plans", res.status);
    }
    const items: WeeklyPlanItem[] = await res.json();
    set({ weekly: { items } });
  },
  addWeeklyPlan: async (data) => {
    const res = await fetch("/api/weekly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: body.error ?? "Failed to create weekly plan",
      };
    }
    const plan: WeeklyPlanItem = await res.json();
    set((state) => ({
      weekly: { items: [plan, ...state.weekly.items] },
    }));
    return { ok: true, plan };
  },
  updateWeeklyPlan: async (id, data) => {
    const res = await fetch(`/api/weekly/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: body.error ?? "Failed to update weekly plan",
      };
    }
    const plan: WeeklyPlanItem = await res.json();
    set((state) => ({
      weekly: {
        items: state.weekly.items.map((item) => (item._id === id ? plan : item)),
      },
    }));
    return { ok: true, plan };
  },
  deleteWeeklyPlan: async (id) => {
    const res = await fetch(`/api/weekly/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new ApiError("Failed to delete weekly plan", res.status);
    }
    set((state) => ({
      weekly: {
        items: state.weekly.items.filter((item) => item._id !== id),
      },
    }));
  },
  toggleGoal: async (id, goalIndex, done) => {
    const res = await fetch(`/api/weekly/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalIndex, done }),
    });
    if (!res.ok) {
      throw new ApiError("Failed to toggle weekly goal", res.status);
    }
    set((state) => ({
      weekly: {
        items: state.weekly.items.map((item) => {
          if (item._id !== id) return item;
          const goals = item.goals.map((goal, index) =>
            index === goalIndex ? { ...goal, done } : goal
          );
          return { ...item, goals };
        }),
      },
    }));
  },
});
