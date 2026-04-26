import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'campus'; // campus, friends, global

    // In production, this would fetch from database based on type
    // Mock response for MVP
    const leaderboard = [
      { rank: 1, userId: '1', username: 'alex_human', totalPoints: 1250, completedQuests: 45 },
      { rank: 2, userId: '2', username: 'sarah_world', totalPoints: 1180, completedQuests: 42 },
      { rank: 3, userId: '3', username: 'mike_real', totalPoints: 1050, completedQuests: 38 },
      { rank: 4, userId: '4', username: 'emma_connect', totalPoints: 980, completedQuests: 35 },
      { rank: 5, userId: '5', username: 'john_service', totalPoints: 920, completedQuests: 33 },
      { rank: 6, userId: '6', username: 'lisa_mindful', totalPoints: 850, completedQuests: 30 },
      { rank: 7, userId: '7', username: 'david_active', totalPoints: 780, completedQuests: 28 },
      { rank: 8, userId: '8', username: 'katie_community', totalPoints: 720, completedQuests: 26 },
      { rank: 9, userId: '9', username: 'tom_helper', totalPoints: 650, completedQuests: 24 },
      { rank: 10, userId: '10', username: 'anna_walker', totalPoints: 580, completedQuests: 21 },
    ];

    return NextResponse.json({ type, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
