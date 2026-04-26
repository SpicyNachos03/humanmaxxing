import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // In production, this would fetch from database
    // Mock response for MVP
    const userProgress = {
      userId,
      totalPoints: 350,
      completedQuests: ['walk-10', 'meditate-no-phone'],
      currentStreak: 3,
      badges: [
        { id: 'first-quest', name: 'First Steps', icon: '🎯', unlockedAt: '2026-04-20' },
        { id: 'streak-3', name: 'On Fire', icon: '🔥', unlockedAt: '2026-04-23' },
        { id: 'points-100', name: 'Century', icon: '💯', unlockedAt: '2026-04-22' },
      ],
    };

    return NextResponse.json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}
