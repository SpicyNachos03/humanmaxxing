import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompletion extends Document {
  walletAddress: string;
  questId: string;
  questTitle: string;
  questCategory: 'movement' | 'community' | 'mindfulness' | 'service' | 'discomfort' | 'daily';
  pointsEarned: number;
  verificationTypes: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  completedAt: Date;
}

const CompletionSchema = new Schema<ICompletion>(
  {
    walletAddress: { type: String, required: true, index: true },
    questId: { type: String, required: true },
    questTitle: { type: String, required: true },
    questCategory: {
      type: String,
      required: true,
      enum: ['movement', 'community', 'mindfulness', 'service', 'discomfort', 'daily'],
    },
    pointsEarned: { type: Number, required: true },
    verificationTypes: [{ type: String }],
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    completedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

CompletionSchema.index({ walletAddress: 1, completedAt: -1 });

export const Completion: Model<ICompletion> =
  mongoose.models.Completion || mongoose.model<ICompletion>('Completion', CompletionSchema);
