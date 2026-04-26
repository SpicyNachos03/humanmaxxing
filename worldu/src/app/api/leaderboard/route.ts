import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'campus'; // campus, friends, global

    // Fetch top users from MongoDB sorted by total points
    const users = await User.find()
      .sort({ totalPoints: -1 })
      .limit(10)
      .select('walletAddress username totalPoints completedQuests');

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.walletAddress,
      username: user.username,
      totalPoints: user.totalPoints,
      completedQuests: user.completedQuests.length
    }));

    return NextResponse.json({ type, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
