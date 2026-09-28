import mongoose, { Schema, Model } from "mongoose";

export interface SessionDocument extends mongoose.Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<SessionDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

const Session: Model<SessionDocument> =
  mongoose.models.Session ||
  mongoose.model<SessionDocument>("Session", SessionSchema);

export default Session;
