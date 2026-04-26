import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
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
    } else if (username && (!user.username || user.username === 'New User')) {
      // Update username only if it's not set or still "New User"
      user.username = username;
      await user.save();
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
