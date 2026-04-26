'use client';

import { Quest } from '@/types/quest';
import { Icon } from '@/components/Icon';
import { Check } from 'iconoir-react';
import { useRouter } from 'next/navigation';

interface QuestCardProps {
  quest: Quest;
  completed?: boolean;
}

const verificationLabels: Record<string, string> = {
  self_report: 'Quick',
  photo: 'Photo',
  location: 'Location',
  location_time: 'Location',
  timer: 'Timer',
  qr_code: 'QR Code',
  peer_confirm: 'Peer',
  selfie: 'Selfie',
};

export const QuestCard = ({ quest, completed = false }: QuestCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/quests/${quest.id}`);
  };

  return (
    <div
      className={`w-full rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] border-2 border-brand-light ${
        completed ? 'bg-brand-lightest opacity-75' : 'bg-white-force hover:shadow-md'
      }`}
      onClick={handleClick}
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
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-lightest text-brand-dark">
          {verificationLabels[quest.verificationType] || 'Verify'}
        </span>
      </div>
    </div>
  );
};
