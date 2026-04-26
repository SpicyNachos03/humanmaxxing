import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { DAILY_QUESTS } from '@/data/quests';
import { QuestDetail } from '@/components/QuestDetail';
import { BackButton } from '@/components/BackButton';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { notFound } from 'next/navigation';

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
