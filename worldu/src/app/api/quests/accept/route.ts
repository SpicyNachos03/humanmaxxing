import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getQuestCooldownEnd,
  getQuestCooldownRemainingHours,
} from '@/lib/questCooldown';

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
    const { questId } = body;

    if (!questId) {
      return NextResponse.json(
        { error: 'Missing questId' },
        { status: 400 }
      );
    }

    const userId = session.user.walletAddress;
    const user = await User.findOne({ walletAddress: userId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Block accepting if quest is still on cooldown from a recent completion
    const hoursRemaining = getQuestCooldownRemainingHours(
      questId,
      user.questCompletions
    );
    if (hoursRemaining !== null) {
      const cooldownEnd = getQuestCooldownEnd(questId, user.questCompletions);
      return NextResponse.json(
        {
          error: 'Quest on cooldown',
          message: `You can start this quest again in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`,
          hoursRemaining,
          cooldownEnd,
        },
        { status: 400 }
      );
    }

    if (!user.questAcceptances) {
      user.questAcceptances = [];
    }
    user.questAcceptances = user.questAcceptances.filter(
      (qa: { questId: string }) => qa.questId !== questId
    );
    user.questAcceptances.push({
      questId,
      acceptedAt: new Date(),
    });
    user.markModified('questAcceptances');
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Quest accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting quest:', error);
    return NextResponse.json(
      { error: 'Failed to accept quest' },
      { status: 500 }
    );
  }
}
