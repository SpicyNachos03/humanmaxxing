import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { BADGES } from '@/data/quests';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('userId');
    const username = searchParams.get('username');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    let user = await User.findOne({ walletAddress });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        walletAddress,
        username: username || 'New User',
        totalPoints: 0,
        currentStreak: 0,
        completedQuests: [],
        badges: []
      });
    } else {
      // Check and award badges for existing users
      const newBadges = [];
      const existingBadgeIds = user.badges.map(b => b.id);

      // First Steps badge - complete first quest
      if (!existingBadgeIds.includes('first-quest') && user.completedQuests.length >= 1) {
        newBadges.push({
          id: 'first-quest',
          name: 'First Steps',
          icon: 'dash-flag',
          unlockedAt: new Date()
        });
      }

      // Century badge - earn 100 points
      if (!existingBadgeIds.includes('points-100') && user.totalPoints >= 100) {
        newBadges.push({
          id: 'points-100',
          name: 'Century',
          icon: 'star',
          unlockedAt: new Date()
        });
      }

      // High Achiever badge - earn 500 points
      if (!existingBadgeIds.includes('points-500') && user.totalPoints >= 500) {
        newBadges.push({
          id: 'points-500',
          name: 'High Achiever',
          icon: 'trophy',
          unlockedAt: new Date()
        });
      }

      // On Fire badge - 3-day streak
      if (!existingBadgeIds.includes('streak-3') && user.currentStreak >= 3) {
        newBadges.push({
          id: 'streak-3',
          name: 'On Fire',
          icon: 'fire-flame',
          unlockedAt: new Date()
        });
      }

      // Unstoppable badge - 7-day streak
      if (!existingBadgeIds.includes('streak-7') && user.currentStreak >= 7) {
        newBadges.push({
          id: 'streak-7',
          name: 'Unstoppable',
          icon: 'flash',
          unlockedAt: new Date()
        });
      }

      // Add new badges to user
      if (newBadges.length > 0) {
        user.badges.push(...newBadges);
        await user.save();
      }

      // Update username if needed
      if (username && (!user.username || user.username === 'New User')) {
        user.username = username;
        await user.save();
      }
    }

    return NextResponse.json({
      userId: user.walletAddress,
      username: user.username,
      totalPoints: user.totalPoints,
      completedQuests: user.completedQuests,
      questCompletions: user.questCompletions || [],
      questAcceptances: user.questAcceptances || [],
      currentStreak: user.currentStreak,
      badges: user.badges,
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}
