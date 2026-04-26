'use client';

import { Quest } from '@/types/quest';
import { QuestCard } from '@/components/QuestCard';

interface HomeContentProps {
  quests: Quest[];
}

export const HomeContent = ({ quests }: HomeContentProps) => {
  return (
    <>
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </>
  );
};
