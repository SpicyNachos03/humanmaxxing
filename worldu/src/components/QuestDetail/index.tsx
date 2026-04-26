'use client';

import { Quest } from '@/types/quest';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface QuestDetailProps {
  quest: Quest;
}

export const QuestDetail = ({ quest }: QuestDetailProps) => {
  const router = useRouter();
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  const getVerificationLabel = () => {
    switch (quest.verificationType) {
      case 'photo':
        return 'Photo proof required';
      case 'location':
        return 'Location verification';
      case 'location_time':
        return 'Location & time verification';
      case 'timer':
        return `Timer: ${quest.duration} minutes`;
      case 'qr_code':
        return 'QR code check-in';
      case 'peer_confirm':
        return 'Peer confirmation required';
      case 'selfie':
        return 'Selfie verification';
      default:
        return 'Verification required';
    }
  };

  const handleCompleteQuest = async () => {
    setButtonState('pending');
    
    // Simulate quest completion
    // In production, this would:
    // 1. Upload proof (photo/video)
    // 2. Verify with World ID
    // 3. Submit to backend
    // 4. Award points
    
    setTimeout(() => {
      setButtonState('success');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 2000);
  };

  return (
    <div className="w-full">
      <div className="border-2 border-gray-200 rounded-xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{quest.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{quest.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-green-600">+{quest.points}</span>
              <span className="text-sm text-gray-500">points</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-gray-600">{quest.instructions}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Verification Method</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {getVerificationLabel()}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Category</h3>
            <span className="text-sm px-3 py-1 bg-gray-100 rounded-full capitalize">
              {quest.category}
            </span>
          </div>
        </div>
      </div>

      <LiveFeedback
        label={{
          failed: 'Failed to complete quest',
          pending: 'Submitting...',
          success: 'Quest completed!',
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={handleCompleteQuest}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Complete Quest
        </Button>
      </LiveFeedback>

      <Button
        onClick={() => router.push('/')}
        disabled={buttonState === 'pending'}
        size="lg"
        variant="secondary"
        className="w-full mt-3"
      >
        Back to Quests
      </Button>
    </div>
  );
};
