import mongoose, { Schema, Model } from "mongoose";

export interface GoalDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<GoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Goal: Model<GoalDocument> =
  mongoose.models.Goal || mongoose.model<GoalDocument>("Goal", GoalSchema);

export default Goal;
