'use client';

import { BADGES } from '@/data/quests';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { CoffeeCup, Crown, Shirt, Medal, Gift, Check } from 'iconoir-react';
import { ComponentType } from 'react';

const REWARDS: { name: string; description: string; cost: number; IconComponent: ComponentType<{ className?: string }> }[] = [
  { name: 'Campus Coffee', description: 'Free coffee at campus cafe', cost: 200, IconComponent: CoffeeCup },
  { name: 'Event Priority', description: 'Skip the line at campus events', cost: 300, IconComponent: Crown },
  { name: 'Exclusive Merch', description: 'WorldU branded t-shirt', cost: 500, IconComponent: Shirt },
];

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`skeleton ${className}`} />
);

export const RewardsContent = () => {
  const { data: session } = useSession();
  const [userPoints, setUserPoints] = useState(0);
  const [username, setUsername] = useState('');
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (session?.user?.walletAddress) {
        try {
          const response = await fetch(`/api/user/progress?userId=${session.user.walletAddress}&username=${encodeURIComponent(session.user.username || '')}`);
          const data = await response.json();
          setUserPoints(data.totalPoints || 0);
          setUsername(data.username || session.user.username || 'User');
          setUnlockedBadges(data.badges?.map((b: any) => b.id) || []);
        } catch (error) {
          console.error('Error fetching user progress:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, [session]);

  const nextReward = REWARDS.find((r) => r.cost > userPoints);
  const nextRewardCost = nextReward?.cost || REWARDS[REWARDS.length - 1].cost;
  const progressToNext = nextReward
    ? Math.min((userPoints / nextRewardCost) * 100, 100)
    : 100;

  return (
    <div className="w-full animate-fade-in">
      {loading ? (
        <div className="space-y-4">
          <SkeletonBlock className="w-full h-36 rounded-2xl" />
          <SkeletonBlock className="w-32 h-5" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} className="w-full h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Points Summary */}
          <div className="rounded-2xl p-5 mb-5 shadow-md bg-brand">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-white-force">Welcome back,</p>
                <p className="text-lg font-bold capitalize text-black-force">{username}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-white-force">Total Points</p>
                <p className="text-3xl font-bold text-black-force">{userPoints}</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-white-force">
                  {nextReward ? `Next: ${nextReward.name}` : 'All rewards unlocked!'}
                </p>
                <p className="text-xs font-medium text-white-force">
                  {nextReward ? `${userPoints}/${nextRewardCost}` : ''}
                </p>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500 bg-white-force"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Medal className="w-5 h-5" /> Your Badges
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-4 text-center transition-all ${
                      isUnlocked
                        ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                        : 'bg-gray-50 border border-gray-100 opacity-50'
                    }`}
                  >
                    <div className="mb-1.5 flex justify-center">
                      <Icon name={badge.icon} className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
                    {isUnlocked && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <Check className="w-3 h-3 text-green-600" />
                        <p className="text-xs text-green-600 font-semibold">Unlocked</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Rewards */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Available Rewards
            </h2>
            <div className="space-y-3">
              {REWARDS.map((reward) => {
                const canRedeem = userPoints >= reward.cost;
                return (
                  <div
                    key={reward.name}
                    className={`border rounded-xl p-4 flex items-center justify-between transition-all ${
                      canRedeem
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <reward.IconComponent className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{reward.name}</p>
                        <p className="text-xs text-gray-500">{reward.description}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className={`font-bold text-sm ${canRedeem ? 'text-green-600' : 'text-gray-400'}`}>
                        {reward.cost} pts
                      </p>
                      <span
                        className={`inline-block text-xs px-3 py-1 rounded-full mt-1 font-medium ${
                          canRedeem
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {canRedeem ? 'Coming Soon' : 'Locked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
