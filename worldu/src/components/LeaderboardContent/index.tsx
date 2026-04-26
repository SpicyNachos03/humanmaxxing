'use client';

import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '@/types/quest';

export const LeaderboardContent = () => {
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

  const renderLeaderboard = (data: LeaderboardEntry[]) => {
    return (
      <div className="w-full space-y-2">
        {data.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  entry.rank === 1
                    ? 'bg-yellow-400 text-yellow-900'
                    : entry.rank === 2
                    ? 'bg-gray-300 text-gray-700'
                    : entry.rank === 3
                    ? 'bg-orange-300 text-orange-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {entry.rank}
              </div>
              <div>
                <p className="font-semibold capitalize">{entry.username}</p>
                <p className="text-xs text-gray-500">{entry.completedQuests} quests</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">{entry.totalPoints}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-3">Global Leaderboard</h2>
      <div className="mt-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading leaderboard...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">Top humans worldwide</p>
            {renderLeaderboard(leaderboard)}
          </>
        )}
      </div>
    </div>
  );
};
