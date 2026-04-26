import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { DAILY_QUESTS } from '@/data/quests';
import { QuestDetail } from '@/components/QuestDetail';
import { BackButton } from '@/components/BackButton';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { notFound, redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { getQuestCooldownRemainingHours } from '@/lib/questCooldown';

export const dynamic = 'force-dynamic';

export default async function QuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const quest = DAILY_QUESTS.find((q) => q.id === id);

  if (!quest) {
    notFound();
  }

  // Server-side cooldown gate: redirect home if user already completed
  // this quest within the cooldown window.
  if (session?.user?.walletAddress) {
    try {
      await connectDB();
      const user = await User.findOne({ walletAddress: session.user.walletAddress });
      const remaining = getQuestCooldownRemainingHours(
        quest.id,
        user?.questCompletions
      );
      if (remaining !== null) {
        redirect('/home');
      }
    } catch (error) {
      // `redirect()` throws internally; rethrow so Next handles it.
      if ((error as { digest?: string })?.digest?.startsWith?.('NEXT_REDIRECT')) {
        throw error;
      }
      console.error('Error checking quest cooldown on server:', error);
    }
  }

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Quest Details"
          startAdornment={<BackButton />}
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize">
                {session?.user.username}
              </p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <QuestDetail quest={quest} />
      </Page.Main>
    </>
  );
}
