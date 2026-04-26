'use client';

import { BADGES } from '@/data/quests';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

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

  return (
    <div className="w-full">
      {loading ? (
        <p className="text-center text-gray-500">Loading rewards...</p>
      ) : (
        <>
          {/* Points Summary */}
          <div className="border-2 border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-lg font-semibold capitalize">{username}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-3xl font-bold text-green-600">{userPoints}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-gray-600">Next Reward</p>
                <p className="text-lg font-semibold">150 pts</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min((userPoints / 500) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{userPoints} / 500 to High Achiever badge</p>
            </div>
          </div>

          {/* Badges Section */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Your Badges</h2>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const isUnlocked = unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`border-2 rounded-xl p-4 text-center ${
                      isUnlocked
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                    {isUnlocked && (
                      <p className="text-xs text-green-600 font-semibold mt-2">✓ Unlocked</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Rewards */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Available Rewards</h2>
            <div className="space-y-3">
              <div className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Campus Coffee</p>
                  <p className="text-sm text-gray-600">Free coffee at campus cafe</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">200 pts</p>
                  <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-full mt-1">
                    Redeem
                  </button>
                </div>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Event Priority</p>
                  <p className="text-sm text-gray-600">Skip the line at campus events</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">300 pts</p>
                  <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-full mt-1">
                    Redeem
                  </button>
                </div>
              </div>
              <div className={`border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between ${userPoints >= 500 ? '' : 'opacity-60'}`}>
                <div>
                  <p className="font-semibold">Exclusive Merch</p>
                  <p className="text-sm text-gray-600">WorldU branded t-shirt</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${userPoints >= 500 ? 'text-green-600' : 'text-gray-400'}`}>500 pts</p>
                  <button className={`text-xs px-3 py-1 rounded-full mt-1 ${userPoints >= 500 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
                    {userPoints >= 500 ? 'Redeem' : 'Locked'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
