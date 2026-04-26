import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { DAILY_QUESTS } from '@/data/quests';
import { NextRequest, NextResponse } from 'next/server';
import { DAILY_QUESTS } from '@/data/quests';

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
    
    const body = await request.json();
    const { questId, userId, proof, location, peerConfirmation } = body;

    // Validate required fields
    if (!questId || !userId || !proof) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the quest to verify location requirements
    const quest = DAILY_QUESTS.find((q) => q.id === questId);
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Server-side location verification
    const requiresLocation = ['location', 'location_time'].includes(quest.verificationType) || quest.targetLocation;
    
    if (requiresLocation) {
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return NextResponse.json(
          { error: 'Location is required for this quest' },
          { status: 400 }
        );
      }

      // Verify against target location if defined
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

    const quest = DAILY_QUESTS.find(q => q.id === questId);
    if (!quest) {
      return NextResponse.json({ error: 'Invalid quest' }, { status: 400 });
    }

    // Check if user already completed this quest
    const user = await User.findOne({ walletAddress: userId });
    if (user && user.completedQuests.includes(questId)) {
      return NextResponse.json(
        { error: 'Quest already completed' },
        { status: 400 }
      );
    }

    // Update user with new quest completion and points
    const updatedUser = await User.findOneAndUpdate(
      { walletAddress: userId },
      {
        $inc: { totalPoints: quest.points, currentStreak: 1 },
        $addToSet: { completedQuests: questId }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      newTotal: updatedUser?.totalPoints,
      pointsEarned: quest.points,
      message: 'Quest completed successfully'
    });
  } catch (error) {
    console.error('Error submitting quest:', error);
    return NextResponse.json(
      { error: 'Failed to submit quest' },
      { status: 500 }
    );
  }
}
