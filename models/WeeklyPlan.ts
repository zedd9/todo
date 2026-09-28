import mongoose, { Schema, Model } from "mongoose";

export interface WeeklyPlanGoal {
  text: string;
  done: boolean;
}

export interface WeeklyPlanDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  goals: WeeklyPlanGoal[];
  memo?: string;
  retrospective?: string;
  goalId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyPlanGoalSchema = new Schema<WeeklyPlanGoal>(
  {
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const WeeklyPlanSchema = new Schema<WeeklyPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekStart: { type: Date, required: true },
    goals: { type: [WeeklyPlanGoalSchema], default: [] },
    memo: { type: String, default: "" },
    retrospective: { type: String, default: "" },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal" },
  },
  { timestamps: true }
);

// Replaces the old single-field unique index: a week is unique per user, not
// globally, now that plans are scoped by userId.
WeeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

const WeeklyPlan: Model<WeeklyPlanDocument> =
  mongoose.models.WeeklyPlan ||
  mongoose.model<WeeklyPlanDocument>("WeeklyPlan", WeeklyPlanSchema);

export default WeeklyPlan;
