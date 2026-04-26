'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Home, Leaderboard, Medal } from 'iconoir-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = () => {
  const router = useRouter();
  const [value, setValue] = useState('home');

  const handleTabChange = (newValue: string) => {
    setValue(newValue);
    switch (newValue) {
      case 'home':
        router.push('/');
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
    <Tabs value={value} onValueChange={handleTabChange}>
      <TabItem value="home" icon={<Home />} label="Quests" />
      <TabItem value="leaderboard" icon={<Leaderboard />} label="Leaderboard" />
      <TabItem value="rewards" icon={<Medal />} label="Rewards" />
    </Tabs>
  );
};
