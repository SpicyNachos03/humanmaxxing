import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { DAILY_QUESTS, BADGES } from '@/data/quests';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

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
    const { questId, proof, location, peerConfirmation } = body;
    const userId = session.user.walletAddress;

    // Validate required fields (proof is optional for self_report quests)
    if (!questId) {
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

    // Server-side location verification (skip for self_report quests)
    const requiresLocation = quest.verificationType !== 'self_report' && (['location', 'location_time'].includes(quest.verificationType) || quest.targetLocation);
    
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

    // Check if user exists and if they already completed this quest
    let user = await User.findOne({ walletAddress: userId });
    
    if (!user) {
      // Create new user with initial points from this quest
      const newBadges = [];
      
      // Award First Steps badge for first quest
      newBadges.push({
        id: 'first-quest',
        name: 'First Steps',
        icon: '🎯',
        unlockedAt: new Date()
      });

      user = await User.create({
        walletAddress: userId,
        username: 'New User',
        totalPoints: quest.points,
        currentStreak: 1,
        completedQuests: [questId],
        badges: newBadges
      });
      
      return NextResponse.json({
        success: true,
        newTotal: user.totalPoints,
        pointsEarned: quest.points,
        message: 'Quest completed successfully'
      });
    }

    if (user.completedQuests.includes(questId)) {
      return NextResponse.json(
        { error: 'Quest already completed' },
        { status: 400 }
      );
    }

    // Update user with new quest completion and points
    user.totalPoints += quest.points;
    user.currentStreak += 1;
    user.completedQuests.push(questId);

    // Check and award badges
    const newBadges = [];
    const existingBadgeIds = user.badges.map(b => b.id);

    // First Steps badge - complete first quest
    if (!existingBadgeIds.includes('first-quest') && user.completedQuests.length === 1) {
      newBadges.push({
        id: 'first-quest',
        name: 'First Steps',
        icon: '🎯',
        unlockedAt: new Date()
      });
    }

    // Century badge - earn 100 points
    if (!existingBadgeIds.includes('points-100') && user.totalPoints >= 100) {
      newBadges.push({
        id: 'points-100',
        name: 'Century',
        icon: '💯',
        unlockedAt: new Date()
      });
    }

    // High Achiever badge - earn 500 points
    if (!existingBadgeIds.includes('points-500') && user.totalPoints >= 500) {
      newBadges.push({
        id: 'points-500',
        name: 'High Achiever',
        icon: '🏆',
        unlockedAt: new Date()
      });
    }

    // On Fire badge - 3-day streak
    if (!existingBadgeIds.includes('streak-3') && user.currentStreak >= 3) {
      newBadges.push({
        id: 'streak-3',
        name: 'On Fire',
        icon: '🔥',
        unlockedAt: new Date()
      });
    }

    // Unstoppable badge - 7-day streak
    if (!existingBadgeIds.includes('streak-7') && user.currentStreak >= 7) {
      newBadges.push({
        id: 'streak-7',
        name: 'Unstoppable',
        icon: '⚡',
        unlockedAt: new Date()
      });
    }

    // Add new badges to user
    if (newBadges.length > 0) {
      user.badges.push(...newBadges);
    }

    await user.save();

    const updatedUser = user;

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
