'use client';

import { useRouter } from 'next/navigation';

interface CatalystCardProps {
  catalyst: {
    title: string;
    description: string;
    category: string;
    difficulty: 'moderate' | 'hard' | 'extreme';
    estimatedMinutes: number;
    verificationHint: string;
    reasoning: string;
    targetArea?: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
      name: string;
    };
  };
  comfortZones: string[];
}

export const CatalystCard = ({ catalyst, comfortZones }: CatalystCardProps) => {
  const router = useRouter();

  return (
    <div
      className="w-full border-2 border-yellow-400 bg-yellow-50 rounded-xl p-4 relative overflow-hidden cursor-pointer hover:border-yellow-500 transition-colors"
      onClick={() => router.push('/questmaster')}
    >
      <div className="absolute top-0 right-0 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
        ⚡ Catalyst
      </div>

      <div className="flex flex-row items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <h3 className="font-semibold text-lg">{catalyst.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-yellow-700">~{catalyst.estimatedMinutes}</span>
          <span className="text-xs text-gray-500">min</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{catalyst.description}</p>
      <p className="text-xs text-gray-400 mb-3">📸 {catalyst.verificationHint}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-yellow-100 rounded-full capitalize">
            {catalyst.category}
          </span>
          <span className="text-xs px-2 py-1 bg-yellow-100 rounded-full capitalize">
            {catalyst.difficulty}
          </span>
        </div>
      </div>
    </div>
  );
};
