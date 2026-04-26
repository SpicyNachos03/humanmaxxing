import connectDB from '@/lib/mongodb';
import { Squad } from '@/models/Squad';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') === 'weekly' ? 'weekly' : 'all';
    const limit = Math.min(50, Number(searchParams.get('limit')) || 25);

    const sortField = range === 'weekly' ? 'weeklyPoints' : 'totalPoints';
    const squads = await Squad.find()
      .sort({ [sortField]: -1, totalPoints: -1 })
      .limit(limit);

    const leaderboard = squads.map((s, i) => ({
      rank: i + 1,
      id: s._id.toString(),
      name: s.name,
      tag: s.tag,
      emoji: s.emoji,
      bannerColor: s.bannerColor,
      totalPoints: s.totalPoints,
      weeklyPoints: s.weeklyPoints,
      weeklyGoal: s.weeklyGoal,
      memberCount: s.members.length,
      weeklyGoalsHit: s.weeklyGoalsHit,
    }));

    return NextResponse.json({ range, leaderboard });
  } catch (error) {
    console.error('Error fetching squad leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squad leaderboard' },
      { status: 500 }
    );
  }
}
