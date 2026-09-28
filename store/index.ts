import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createTodoSlice, TodoSlice } from "./todoSlice";
import { createWeeklySlice, WeeklySlice } from "./weeklySlice";
import { createGoalSlice, GoalSlice } from "./goalSlice";

export type StoreState = TodoSlice & WeeklySlice & GoalSlice;

export const useStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createTodoSlice(...args),
      ...createWeeklySlice(...args),
      ...createGoalSlice(...args),
    }),
    { name: "todo-app-store" }
  )
);

export default useStore;
