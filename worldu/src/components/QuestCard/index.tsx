'use client';

import { Quest } from '@/types/quest';
import { useRouter } from 'next/navigation';

interface QuestCardProps {
  quest: Quest;
  completed?: boolean;
}

export const QuestCard = ({ quest, completed = false }: QuestCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/quests/${quest.id}`);
  };

  return (
    <div
      className="w-full border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300 transition-colors"
      onClick={handleClick}
    >
      <div className="flex flex-row items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{quest.icon}</span>
          <h3 className="font-semibold text-lg">{quest.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-green-600">+{quest.points}</span>
          <span className="text-xs text-gray-500">pts</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{quest.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
          {quest.category}
        </span>
        {completed && (
          <span className="text-xs text-green-600 font-semibold">✓ Completed</span>
        )}
      </div>
    </div>
  );
};
