import connectDB from '@/lib/mongodb';
import { Squad } from '@/models/Squad';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { resetWeeklyIfExpired, summarizeSquad } from '@/lib/squads';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ walletAddress: session.user.walletAddress });
    if (!user) {
      return NextResponse.json({ squad: null });
    }

    let squad = user.squadId ? await Squad.findById(user.squadId) : null;

    // Self-heal: if the user has no squadId (or a stale one) but is actually
    // a member of a squad in MongoDB, repair the link.
    if (!squad) {
      squad = await Squad.findOne({
        'members.walletAddress': session.user.walletAddress,
      });
      if (squad) {
        await User.updateOne(
          { walletAddress: session.user.walletAddress },
          { $set: { squadId: squad._id.toString() } }
        );
      } else if (user.squadId) {
        // Stored squadId points to a deleted squad — clear it.
        await User.updateOne(
          { walletAddress: session.user.walletAddress },
          { $unset: { squadId: '' } }
        );
        return NextResponse.json({ squad: null });
      } else {
        return NextResponse.json({ squad: null });
      }
    }

    if (resetWeeklyIfExpired(squad)) {
      await squad.save();
    }

    return NextResponse.json({ squad: summarizeSquad(squad) });
  } catch (error) {
    console.error('Error loading squad:', error);
    return NextResponse.json({ error: 'Failed to load squad' }, { status: 500 });
  }
}
