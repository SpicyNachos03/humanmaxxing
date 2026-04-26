import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  // If authenticated, redirect to the home page
  if (session) {
    redirect('/home');
  }

  return (
    <Page>
      <Page.Main className="flex flex-col items-center justify-center">
        <AuthButton />
      </Page.Main>
    </Page>
  );
}
