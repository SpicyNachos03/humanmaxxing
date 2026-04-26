import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { LeaderboardContent } from '@/components/LeaderboardContent';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import { Suspense } from 'react';

function LeaderboardLoading() {
  return (
    <div className="w-full flex items-center justify-center py-8">
      <p className="text-gray-500">Loading leaderboard...</p>
    </div>
  );
}

export default async function LeaderboardPage() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Leaderboard"
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
        <Suspense fallback={<LeaderboardLoading />}>
          <LeaderboardContent />
        </Suspense>
      </Page.Main>
    </>
  );
}
