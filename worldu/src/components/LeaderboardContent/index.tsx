'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LeaderboardEntry } from '@/types/quest';
import { Medal1st, Medal, Trophy } from 'iconoir-react';
import { ReactNode } from 'react';

const medalIcons: ReactNode[] = [
  <Medal1st key="1st" className="w-6 h-6 text-green-600" />,
  <Medal key="2nd" className="w-6 h-6 text-green-400" />,
  <Medal key="3rd" className="w-6 h-6 text-green-300" />,
];

const SkeletonRow = () => (
  <div className="flex items-center justify-between p-3 rounded-xl">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full skeleton" />
      <div>
        <div className="w-24 h-4 skeleton mb-1" />
        <div className="w-16 h-3 skeleton" />
      </div>
    </div>
    <div className="w-12 h-5 skeleton" />
  </div>
);

export const LeaderboardContent = () => {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const currentUserId = session?.user?.walletAddress;

  const renderPodium = (top3: LeaderboardEntry[]) => {
    if (top3.length === 0) return null;
    const order = [1, 0, 2]; // silver, gold, bronze layout
    const heights = ['h-20', 'h-28', 'h-16'];
    const podiumColors = ['#86efac', '#22c55e', '#dcfce7']; // 2nd, 1st, 3rd

    return (
      <div className="flex items-end justify-center gap-2 mb-6 mt-2">
        {order.map((idx, i) => {
          const entry = top3[idx];
          if (!entry) return <div key={i} className="flex-1" />;
          const isMe = entry.userId === currentUserId;
          return (
            <div key={entry.userId} className="flex flex-col items-center flex-1">
              <span className="mb-1 flex justify-center">{medalIcons[idx]}</span>
              <p className={`text-xs font-semibold capitalize truncate max-w-full ${isMe ? 'text-green-600' : ''}`}>
                {isMe ? 'You' : entry.username}
              </p>
              <p className="text-xs text-gray-500 mb-1">{entry.totalPoints} pts</p>
              <div
                className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center`}
                style={{ backgroundColor: podiumColors[i] }}
              >
                <span className="text-lg font-bold" style={{ color: '#000000' }}>{entry.rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderList = (data: LeaderboardEntry[]) => {
    const rest = data.slice(3);
    if (rest.length === 0) return null;

    return (
      <div className="w-full space-y-2">
        {rest.map((entry) => {
          const isMe = entry.userId === currentUserId;
          return (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                isMe
                  ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                  : 'border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center font-bold text-sm text-green-600">
                  {entry.rank}
                </div>
                <div>
                  <p className={`font-semibold capitalize text-sm ${isMe ? 'text-green-700' : ''}`}>
                    {isMe ? `${entry.username} (You)` : entry.username}
                  </p>
                  <p className="text-xs text-gray-400">{entry.completedQuests} quests</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${isMe ? 'text-green-600' : 'text-gray-700'}`}>
                  {entry.totalPoints}
                </p>
                <p className="text-xs text-gray-400">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full animate-fade-in">
      {loading ? (
        <div className="space-y-3">
          <div className="w-40 h-5 skeleton mb-2" />
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700 mb-1">No one here yet</p>
          <p className="text-sm text-gray-400">Complete quests to be the first on the leaderboard!</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">Top humans worldwide</p>
          {renderPodium(leaderboard.slice(0, 3))}
          {renderList(leaderboard)}
        </>
      )}
    </div>
  );
};
