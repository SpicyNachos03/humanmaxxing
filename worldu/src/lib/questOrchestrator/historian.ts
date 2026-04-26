import connectDB from '@/lib/mongodb';
import { Completion, ICompletion } from '@/models/Completion';

export interface HabitSummary {
  totalCompletions: number;
  recentCompletions: Array<{
    questId: string;
    questTitle: string;
    questCategory: string;
    completedAt: Date;
  }>;
  categoryCounts: Record<string, number>;
  comfortZones: string[];
  neglectedCategories: string[];
  averagePointsPerQuest: number;
  dominantCategory: string | null;
}

const ALL_CATEGORIES = ['movement', 'community', 'mindfulness', 'service', 'discomfort', 'daily'];
const COMFORT_ZONE_THRESHOLD = 0.4; // 40% of recent quests in one category = comfort zone

/**
 * Log a quest completion to the completions collection.
 */
export async function logCompletion(data: {
  walletAddress: string;
  questId: string;
  questTitle: string;
  questCategory: string;
  pointsEarned: number;
  verificationTypes: string[];
  location?: { latitude: number; longitude: number };
}): Promise<ICompletion> {
  await connectDB();

  const completion = await Completion.create({
    walletAddress: data.walletAddress,
    questId: data.questId,
    questTitle: data.questTitle,
    questCategory: data.questCategory,
    pointsEarned: data.pointsEarned,
    verificationTypes: data.verificationTypes,
    location: data.location,
    completedAt: new Date(),
  });

  return completion;
}

/**
 * Analyze the last 10 quest completions for a user to detect comfort zones
 * and neglected categories.
 */
export async function getUserHabitSummary(worldId: string): Promise<HabitSummary> {
  await connectDB();

  const recentEntries = await Completion.find({ walletAddress: worldId })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean<Array<{
      questId: string;
      questTitle: string;
      questCategory: string;
      completedAt: Date;
      pointsEarned: number;
    }>>();

  const totalCompletions = recentEntries.length;

  if (totalCompletions === 0) {
    return {
      totalCompletions: 0,
      recentCompletions: [],
      categoryCounts: {},
      comfortZones: [],
      neglectedCategories: [...ALL_CATEGORIES],
      averagePointsPerQuest: 0,
      dominantCategory: null,
    };
  }

  // Count categories
  const categoryCounts: Record<string, number> = {};
  let totalPoints = 0;

  for (const entry of recentEntries) {
    const cat = entry.questCategory;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    totalPoints += entry.pointsEarned;
  }

  // Detect comfort zones: categories that appear >= 40% of the time
  const comfortZones: string[] = [];
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count / totalCompletions >= COMFORT_ZONE_THRESHOLD) {
      comfortZones.push(category);
    }
  }

  // Find neglected categories: categories with 0 completions in the last 10
  const neglectedCategories = ALL_CATEGORIES.filter(
    (cat) => !categoryCounts[cat] || categoryCounts[cat] === 0
  );

  // Find dominant category
  let dominantCategory: string | null = null;
  let maxCount = 0;
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantCategory = category;
    }
  }

  return {
    totalCompletions,
    recentCompletions: recentEntries.map((e) => ({
      questId: e.questId,
      questTitle: e.questTitle,
      questCategory: e.questCategory,
      completedAt: e.completedAt,
    })),
    categoryCounts,
    comfortZones,
    neglectedCategories,
    averagePointsPerQuest: Math.round(totalPoints / totalCompletions),
    dominantCategory,
  };
}
