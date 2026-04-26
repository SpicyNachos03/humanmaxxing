import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISquadMember {
  walletAddress: string;
  username: string;
  role: 'owner' | 'member';
  joinedAt: Date;
  contributedPoints: number;
  weeklyContributedPoints: number;
  lastContributionAt?: Date;
}

export interface ISquad extends Document {
  name: string;
  tag: string;
  description?: string;
  emoji: string;
  bannerColor: string;
  inviteCode: string;
  ownerId: string;
  members: ISquadMember[];
  totalPoints: number;
  weeklyPoints: number;
  weeklyGoal: number;
  weekStartedAt: Date;
  weeklyGoalsHit: number;
  createdAt: Date;
  updatedAt: Date;
}

const SquadMemberSchema = new Schema<ISquadMember>(
  {
    walletAddress: { type: String, required: true },
    username: { type: String, required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    contributedPoints: { type: Number, default: 0 },
    weeklyContributedPoints: { type: Number, default: 0 },
    lastContributionAt: { type: Date },
  },
  { _id: false }
);

const SquadSchema = new Schema<ISquad>(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    tag: { type: String, required: true, trim: true, uppercase: true, maxlength: 5 },
    description: { type: String, maxlength: 200 },
    emoji: { type: String, default: '🛡️' },
    bannerColor: { type: String, default: '#22c55e' },
    inviteCode: { type: String, required: true, unique: true, index: true, uppercase: true },
    ownerId: { type: String, required: true, index: true },
    members: { type: [SquadMemberSchema], default: [] },
    totalPoints: { type: Number, default: 0, index: true },
    weeklyPoints: { type: Number, default: 0, index: true },
    weeklyGoal: { type: Number, default: 500 },
    weekStartedAt: { type: Date, default: Date.now },
    weeklyGoalsHit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SquadSchema.index({ totalPoints: -1 });
SquadSchema.index({ weeklyPoints: -1 });

export const MAX_SQUAD_MEMBERS = 10;

export const Squad: Model<ISquad> =
  mongoose.models.Squad || mongoose.model<ISquad>('Squad', SquadSchema);
