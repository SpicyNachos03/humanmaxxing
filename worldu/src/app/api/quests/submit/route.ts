import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { DAILY_QUESTS } from '@/data/quests';
import { NextRequest, NextResponse } from 'next/server';

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
