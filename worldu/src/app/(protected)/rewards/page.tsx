import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { RewardsContent } from '@/components/RewardsContent';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function RewardsPage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Rewards & Badges"
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
        <RewardsContent />
      </Page.Main>
    </>
  );
}
