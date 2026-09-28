import mongoose, { Schema, Model } from "mongoose";

export interface UserDocument extends mongoose.Document {
  githubId: string;
  username: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
