import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { QuestCard } from '@/components/QuestCard';
import { DAILY_QUESTS } from '@/data/quests';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function Home() {
  const session = await auth();

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
            HELLO HELLO HELLO Complete quests to earn points and unlock rewards. Get rewarded for being human again.
          </p>
          <div className="flex flex-col gap-3">
            {DAILY_QUESTS.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      </Page.Main>
    </>
  );
}
