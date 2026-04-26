import connectDB from '@/lib/mongodb';
import { Squad } from '@/models/Squad';
import { User } from '@/models/User';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ walletAddress: session.user.walletAddress });
    if (!user || !user.squadId) {
      return NextResponse.json({ error: 'You are not in a squad' }, { status: 400 });
    }

    const squad = await Squad.findById(user.squadId);
    if (!squad) {
      await User.updateOne(
        { walletAddress: user.walletAddress },
        { $unset: { squadId: '' } }
      );
      return NextResponse.json({ success: true });
    }

    const isOwner = squad.ownerId === user.walletAddress;
    squad.members = squad.members.filter(
      (m) => m.walletAddress !== user.walletAddress
    );

    if (squad.members.length === 0) {
      // Last member leaving — delete the squad entirely.
      await squad.deleteOne();
    } else {
      if (isOwner) {
        // Promote next member to owner.
        const next = squad.members[0];
        next.role = 'owner';
        squad.ownerId = next.walletAddress;
      }
      await squad.save();
    }

    await User.updateOne(
      { walletAddress: user.walletAddress },
      { $unset: { squadId: '' } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving squad:', error);
    return NextResponse.json({ error: 'Failed to leave squad' }, { status: 500 });
  }
}
