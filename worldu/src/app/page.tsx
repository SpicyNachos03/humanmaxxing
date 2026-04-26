import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { redirect } from 'next/navigation';
import { Globe } from 'iconoir-react';

export default async function Home() {
  const session = await auth();

  // If authenticated, redirect to the home page
  if (session) {
    redirect('/home');
  }

  return (
    <Page className="bg-gradient-to-br from-green-50 via-white to-green-50">
      <Page.Main className="flex flex-col items-center justify-center gap-8 px-8">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-lg">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">WorldU</h1>
          <p className="text-center text-gray-500 text-sm max-w-[260px] leading-relaxed">
            Complete real-world quests, earn points, and unlock rewards. Get rewarded for being human again.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <AuthButton />
        </div>
        <p className="text-xs text-gray-400 mt-4">Powered by World ID</p>
      </Page.Main>
    </Page>
  );
}
