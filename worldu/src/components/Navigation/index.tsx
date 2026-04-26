'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, Leaderboard, Medal } from 'iconoir-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const getValueFromPath = () => {
    if (pathname === '/' || pathname === '/home' || pathname.startsWith('/quests')) return 'home';
    if (pathname === '/leaderboard') return 'leaderboard';
    if (pathname === '/rewards') return 'rewards';
    return 'home';
  };

  const handleTabChange = (newValue: string) => {
    switch (newValue) {
      case 'home':
        router.push('/home');
        break;
      case 'leaderboard':
        router.push('/leaderboard');
        break;
      case 'rewards':
        router.push('/rewards');
        break;
    }
  };

  return (
    <Tabs value={getValueFromPath()} onValueChange={handleTabChange}>
      <TabItem value="home" icon={<Home />} label="Quests" />
      <TabItem value="leaderboard" icon={<Leaderboard />} label="Leaderboard" />
      <TabItem value="rewards" icon={<Medal />} label="Rewards" />
    </Tabs>
  );
};
