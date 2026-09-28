import { StateCreator } from "zustand";
import { ApiError } from "@/lib/apiClientError";

export { ApiError };

export interface TodoItem {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "doing" | "done";
  priority: "high" | "medium" | "low";
  dueDate?: string;
  dayOfWeek?: number;
  order: string;
  weeklyPlanId?: string;
  goalId?: string;
}

export interface TodoInput {
  title: string;
  description?: string;
  status?: "todo" | "doing" | "done";
  priority?: "high" | "medium" | "low";
  dueDate?: string;
  dayOfWeek?: number;
  order?: string;
  weeklyPlanId?: string;
  goalId?: string;
}

export interface TodoFilters {
  status?: string;
  weeklyPlanId?: string;
  goalId?: string;
}

export interface TodoSlice {
  todos: {
    items: TodoItem[];
  };
  fetchTodos: (filters?: TodoFilters) => Promise<void>;
  addTodo: (data: TodoInput) => Promise<TodoItem>;
  updateTodo: (id: string, data: TodoInput) => Promise<TodoItem>;
  deleteTodo: (id: string) => Promise<void>;
  reorderTodo: (id: string, newStatus: string, newOrder: string) => Promise<void>;
}

export const createTodoSlice: StateCreator<TodoSlice, [], [], TodoSlice> = (set, get) => ({
  todos: {
    items: [],
  },
  fetchTodos: async (filters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.weeklyPlanId) params.set("weeklyPlanId", filters.weeklyPlanId);
    if (filters?.goalId) params.set("goalId", filters.goalId);
    const query = params.toString();
    const res = await fetch(`/api/todos${query ? `?${query}` : ""}`);
    if (!res.ok) {
      throw new ApiError("Failed to fetch todos", res.status);
    }
    const items: TodoItem[] = await res.json();
    set({ todos: { items } });
  },
  addTodo: async (data) => {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new ApiError("Failed to create todo", res.status);
    }
    const todo: TodoItem = await res.json();
    set((state) => ({
      todos: { items: [...state.todos.items, todo] },
    }));
    return todo;
  },
  updateTodo: async (id, data) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new ApiError("Failed to update todo", res.status);
    }
    const todo: TodoItem = await res.json();
    set((state) => ({
      todos: {
        items: state.todos.items.map((item) => (item._id === id ? todo : item)),
      },
    }));
    return todo;
  },
  deleteTodo: async (id) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new ApiError("Failed to delete todo", res.status);
    }
    set((state) => ({
      todos: {
        items: state.todos.items.filter((item) => item._id !== id),
      },
    }));
  },
  reorderTodo: async (id, newStatus, newOrder) => {
    const previousItems = get().todos.items;

    set({
      todos: {
        items: previousItems.map((item) =>
          item._id === id
            ? { ...item, status: newStatus as TodoItem["status"], order: newOrder }
            : item
        ),
      },
    });

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, order: newOrder }),
      });
      if (!res.ok) {
        throw new ApiError("Failed to reorder todo", res.status);
      }
    } catch (error) {
      set({ todos: { items: previousItems } });
      throw error;
    }
  },
});
