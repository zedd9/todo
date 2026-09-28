import mongoose, { Schema, Model } from "mongoose";

export type TodoStatus = "todo" | "doing" | "done";
export type TodoPriority = "high" | "medium" | "low";

export interface TodoDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  dayOfWeek?: number;
  order: string;
  weeklyPlanId?: mongoose.Types.ObjectId;
  goalId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<TodoDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    dueDate: { type: Date },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    order: { type: String, required: true },
    weeklyPlanId: { type: Schema.Types.ObjectId, ref: "WeeklyPlan" },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal" },
  },
  { timestamps: true }
);

TodoSchema.index({ status: 1, order: 1 });

const Todo: Model<TodoDocument> =
  mongoose.models.Todo || mongoose.model<TodoDocument>("Todo", TodoSchema);

export default Todo;
