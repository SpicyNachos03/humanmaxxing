'use client';

import { Quest } from '@/types/quest';
import { Icon } from '@/components/Icon';
import { Check } from 'iconoir-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface QuestCardProps {
  quest: Quest;
  completed?: boolean;
  onCooldown?: boolean;
}

export const QuestCard = ({
  quest,
  completed = false,
  onCooldown = false,
}: QuestCardProps) => {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLocked = onCooldown;

  const handleClick = async () => {
    if (isLocked || accepting) return;

    setAccepting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/quests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId: quest.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Don't navigate if the server says we're on cooldown
        if (response.status === 400 && errorData?.error === 'Quest on cooldown') {
          setErrorMessage(
            errorData?.message || 'This quest is currently on cooldown.'
          );
          router.refresh();
          return;
        }
        console.error('Failed to accept quest:', errorData);
      }

      router.push(`/quests/${quest.id}`);
    } catch (error) {
      console.error('Error accepting quest:', error);
      router.push(`/quests/${quest.id}`);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div
      className={`w-full border-2 rounded-xl p-4 transition-colors ${
        isLocked
          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
      }`}
      onClick={handleClick}
      aria-disabled={isLocked}
    >
      <div className="flex flex-row items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-lightest flex items-center justify-center">
            <span className="text-brand"><Icon name={quest.icon} className="w-5 h-5" /></span>
          </div>
          <h3 className={`font-semibold text-base ${completed ? 'line-through text-gray-400' : ''}`}>
            {quest.title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {completed ? (
            <span className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 bg-brand-light text-black-force">
              <Check className="w-3 h-3" /> Done
            </span>
          ) : (
            <>
              <span className="text-sm font-bold text-brand">+{quest.points}</span>
              <span className="text-xs text-gray-400">pts</span>
            </>
          )}
        </div>
      </div>
      <p className={`text-sm mb-3 ${completed ? 'text-gray-400' : 'text-gray-500'}`}>
        {quest.description}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-brand-medium text-white-force">
          {quest.category}
        </span>
        {quest.duration && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-lightest text-brand-dark">
            {quest.duration} min
          </span>
        )}
      </div>
      {errorMessage && (
        <p className="text-xs text-yellow-700 mt-2">{errorMessage}</p>
      )}
    </div>
  );
};
