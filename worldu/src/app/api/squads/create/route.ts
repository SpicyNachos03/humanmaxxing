import connectDB from '@/lib/mongodb';
import { Squad, MAX_SQUAD_MEMBERS } from '@/models/Squad';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateInviteCode,
  SQUAD_WEEKLY_GOAL_DEFAULT,
  summarizeSquad,
} from '@/lib/squads';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name ?? '').toString().trim();
    const tag = (body.tag ?? '').toString().trim().toUpperCase();
    const description = (body.description ?? '').toString().trim();
    const emoji = (body.emoji ?? '🛡️').toString();
    const bannerColor = (body.bannerColor ?? '#22c55e').toString();
    const weeklyGoal = Number.isFinite(Number(body.weeklyGoal))
      ? Math.max(50, Math.min(5000, Number(body.weeklyGoal)))
      : SQUAD_WEEKLY_GOAL_DEFAULT;

    if (!name || name.length > 40) {
      return NextResponse.json(
        { error: 'Squad name is required (max 40 chars)' },
        { status: 400 }
      );
    }
    if (!tag || tag.length < 2 || tag.length > 5) {
      return NextResponse.json(
        { error: 'Tag must be 2–5 characters' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ walletAddress: session.user.walletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.squadId) {
      return NextResponse.json(
        { error: 'You are already in a squad. Leave first to create a new one.' },
        { status: 400 }
      );
    }

    // Ensure unique invite code (very small probability of collision).
    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const exists = await Squad.findOne({ inviteCode });
      if (!exists) break;
      inviteCode = generateInviteCode();
    }

    const squad = await Squad.create({
      name,
      tag,
      description,
      emoji,
      bannerColor,
      inviteCode,
      ownerId: user.walletAddress,
      weeklyGoal,
      members: [
        {
          walletAddress: user.walletAddress,
          username: user.username,
          role: 'owner',
          joinedAt: new Date(),
          contributedPoints: 0,
          weeklyContributedPoints: 0,
        },
      ],
    });

    const squadIdStr = squad._id.toString();
    await User.updateOne(
      { walletAddress: user.walletAddress },
      { $set: { squadId: squadIdStr } }
    );

    void MAX_SQUAD_MEMBERS;

    return NextResponse.json({ squad: summarizeSquad(squad) });
  } catch (error) {
    console.error('Error creating squad:', error);
    return NextResponse.json({ error: 'Failed to create squad' }, { status: 500 });
  }
}
