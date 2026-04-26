export type VerificationType = 'selfie' | 'location' | 'photo' | 'timer' | 'qr_code' | 'peer_confirm' | 'location_time';

export interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  verificationType: VerificationType;
  instructions: string;
  icon: string;
  duration?: number; // in minutes for timer-based quests
  category: 'movement' | 'community' | 'mindfulness' | 'service' | 'discomfort';
}

export interface QuestSubmission {
  questId: string;
  userId: string;
  proof: string; // URL to photo/video or other proof
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  peerConfirmation?: string; // peer user ID
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  completedQuests: string[];
  currentStreak: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profilePictureUrl?: string;
  totalPoints: number;
  completedQuests: number;
}
