import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { DAILY_QUESTS } from '@/data/quests';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getQuestCooldownEnd,
  getQuestCooldownRemainingHours,
} from '@/lib/questCooldown';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized. Please authenticate first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questId, location, peerConfirmation } = body;
    const userId = session.user.walletAddress;

    if (!questId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const quest = DAILY_QUESTS.find((q) => q.id === questId);
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Server-side location verification (skip for self_report quests)
    const requiresLocation =
      quest.verificationType !== 'self_report' &&
      (['location', 'location_time'].includes(quest.verificationType) ||
        quest.targetLocation);

    if (requiresLocation) {
      if (
        !location ||
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Location is required for this quest' },
          { status: 400 }
        );
      }

      if (quest.targetLocation) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          quest.targetLocation.latitude,
          quest.targetLocation.longitude
        );

        if (distance > quest.targetLocation.radiusMeters) {
          return NextResponse.json(
            {
              error: 'Location verification failed',
              message: `You are ${(distance / 1000).toFixed(1)}km away from the quest location. Please move closer.`,
              distance,
              requiredRadius: quest.targetLocation.radiusMeters,
            },
            { status: 400 }
          );
        }
      }
    }

    let user = await User.findOne({ walletAddress: userId });

    if (!user) {
      user = await User.create({
        walletAddress: userId,
        username: 'New User',
        totalPoints: quest.points,
        currentStreak: 1,
        completedQuests: [questId],
        questCompletions: [
          {
            questId,
            completedAt: new Date(),
          },
        ],
        badges: [],
      });

      return NextResponse.json({
        success: true,
        newTotal: user.totalPoints,
        pointsEarned: quest.points,
        message: 'Quest completed successfully',
      });
    }

    // Enforce 24h cooldown based on the latest completion timestamp
    const hoursRemaining = getQuestCooldownRemainingHours(
      questId,
      user.questCompletions
    );
    if (hoursRemaining !== null) {
      const cooldownEnd = getQuestCooldownEnd(questId, user.questCompletions);
      return NextResponse.json(
        {
          error: 'Quest on cooldown',
          message: `You can complete this quest again in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`,
          hoursRemaining,
          cooldownEnd,
        },
        { status: 400 }
      );
    }

    user.totalPoints += quest.points;
    user.currentStreak += 1;
    if (!user.completedQuests.includes(questId)) {
      user.completedQuests.push(questId);
    }

    if (!user.questCompletions) {
      user.questCompletions = [];
    }
    user.questCompletions = user.questCompletions.filter(
      (qc: { questId: string }) => qc.questId !== questId
    );
    user.questCompletions.push({
      questId,
      completedAt: new Date(),
    });
    user.markModified('questCompletions');

    await user.save();

    return NextResponse.json({
      success: true,
      newTotal: user.totalPoints,
      pointsEarned: quest.points,
      message: 'Quest completed successfully',
    });
  } catch (error) {
    console.error('Error submitting quest:', error);
    return NextResponse.json(
      { error: 'Failed to submit quest' },
      { status: 500 }
    );
  }
}
