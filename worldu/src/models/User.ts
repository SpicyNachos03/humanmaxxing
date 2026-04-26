import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  username: string;
  profilePictureUrl?: string;
  totalPoints: number;
  currentStreak: number;
  completedQuests: string[];
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    unlockedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    profilePictureUrl: { type: String },
    totalPoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    completedQuests: [{ type: String }],
    badges: [{
      id: String,
      name: String,
      icon: String,
      unlockedAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
