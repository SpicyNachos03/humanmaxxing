import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { QuestMasterChat } from '@/components/QuestMaster';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export const dynamic = 'force-dynamic';

export default async function QuestMasterPage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Quest Master"
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
      <Page.Main className="flex flex-col p-0 mb-16">
        <QuestMasterChat />
      </Page.Main>
    </>
  );
}
