import connectDB from '@/lib/mongodb';
import { Squad, MAX_SQUAD_MEMBERS } from '@/models/Squad';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { resetWeeklyIfExpired, summarizeSquad } from '@/lib/squads';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const inviteCode = (body.inviteCode ?? '').toString().trim().toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code required' }, { status: 400 });
    }

    const user = await User.findOne({ walletAddress: session.user.walletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.squadId) {
      return NextResponse.json(
        { error: 'You are already in a squad. Leave first to join another.' },
        { status: 400 }
      );
    }

    const squad = await Squad.findOne({ inviteCode });
    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    if (squad.members.length >= MAX_SQUAD_MEMBERS) {
      return NextResponse.json(
        { error: `Squad is full (${MAX_SQUAD_MEMBERS} members max)` },
        { status: 400 }
      );
    }

    const squadIdStr = squad._id.toString();
    if (squad.members.some((m) => m.walletAddress === user.walletAddress)) {
      await User.updateOne(
        { walletAddress: user.walletAddress },
        { $set: { squadId: squadIdStr } }
      );
      return NextResponse.json({ squad: summarizeSquad(squad) });
    }

    resetWeeklyIfExpired(squad);

    squad.members.push({
      walletAddress: user.walletAddress,
      username: user.username,
      role: 'member',
      joinedAt: new Date(),
      contributedPoints: 0,
      weeklyContributedPoints: 0,
    });

    await squad.save();

    await User.updateOne(
      { walletAddress: user.walletAddress },
      { $set: { squadId: squadIdStr } }
    );

    return NextResponse.json({ squad: summarizeSquad(squad) });
  } catch (error) {
    console.error('Error joining squad:', error);
    return NextResponse.json({ error: 'Failed to join squad' }, { status: 500 });
  }
}
