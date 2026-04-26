'use client';

import { Quest } from '@/types/quest';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface QuestCardProps {
  quest: Quest;
  completed?: boolean;
  onCooldown?: boolean;
  cooldownHoursRemaining?: number | null;
}

export const QuestCard = ({
  quest,
  completed = false,
  onCooldown = false,
  cooldownHoursRemaining = null,
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
        {onCooldown ? (
          <span className="text-xs text-yellow-600 font-semibold">
            ✓ Completed - resets in {cooldownHoursRemaining ?? 24}h
          </span>
        ) : completed ? (
          <span className="text-xs text-green-600 font-semibold">✓ Completed</span>
        ) : null}
        {accepting && (
          <span className="text-xs text-gray-500">Accepting...</span>
        )}
      </div>
      {errorMessage && (
        <p className="text-xs text-yellow-700 mt-2">{errorMessage}</p>
      )}
    </div>
  );
};
