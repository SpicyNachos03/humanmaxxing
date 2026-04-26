import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { HomeContent } from '@/components/HomeContent';
import { DAILY_QUESTS } from '@/data/quests';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { getQuestCooldownRemainingHours } from '@/lib/questCooldown';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();

  // Read user progress directly from the DB to avoid HTTP fetch + caching issues
  let questCompletions: Array<{ questId: string; completedAt: Date }> = [];
  let completedQuestIds: string[] = [];

  if (session?.user?.walletAddress) {
    try {
      await connectDB();
      const user = await User.findOne({ walletAddress: session.user.walletAddress });
      if (user) {
        questCompletions = user.questCompletions ?? [];
        completedQuestIds = user.completedQuests ?? [];
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  }

  const now = new Date();
  const cooldownByQuestId = new Map<string, number>();
  DAILY_QUESTS.forEach((quest) => {
    const remaining = getQuestCooldownRemainingHours(quest.id, questCompletions, now);
    if (remaining !== null) {
      cooldownByQuestId.set(quest.id, remaining);
    }
  });

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Daily Quests"
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
        <div className="w-full">
          <p className="text-sm text-gray-600 mb-4">
            Complete quests to earn points and unlock rewards. Get rewarded for being human again.
          </p>
          <div className="flex flex-col gap-3">
            {DAILY_QUESTS.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                completed={completedQuestIds.includes(quest.id)}
                onCooldown={cooldownByQuestId.has(quest.id)}
                cooldownHoursRemaining={cooldownByQuestId.get(quest.id) ?? null}
              />
            ))}
          </div>
        </div>
      </Page.Main>
    </>
  );
}
