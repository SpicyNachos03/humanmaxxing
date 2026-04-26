'use client';

import { Tabs, TabItem } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { LeaderboardEntry } from '@/types/quest';
import { Home, User, Globe } from 'iconoir-react';

// Mock data for demonstration
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '1', username: 'alex_human', totalPoints: 1250, completedQuests: 45 },
  { rank: 2, userId: '2', username: 'sarah_world', totalPoints: 1180, completedQuests: 42 },
  { rank: 3, userId: '3', username: 'mike_real', totalPoints: 1050, completedQuests: 38 },
  { rank: 4, userId: '4', username: 'emma_connect', totalPoints: 980, completedQuests: 35 },
  { rank: 5, userId: '5', username: 'john_service', totalPoints: 920, completedQuests: 33 },
  { rank: 6, userId: '6', username: 'lisa_mindful', totalPoints: 850, completedQuests: 30 },
  { rank: 7, userId: '7', username: 'david_active', totalPoints: 780, completedQuests: 28 },
  { rank: 8, userId: '8', username: 'katie_community', totalPoints: 720, completedQuests: 26 },
  { rank: 9, userId: '9', username: 'tom_helper', totalPoints: 650, completedQuests: 24 },
  { rank: 10, userId: '10', username: 'anna_walker', totalPoints: 580, completedQuests: 21 },
];

export const LeaderboardContent = () => {
  const [activeTab, setActiveTab] = useState('campus');

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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabItem value="campus" label="Campus" icon={<Home />} />
        <TabItem value="friends" label="Friends" icon={<User />} />
        <TabItem value="global" label="Global" icon={<Globe />} />
      </Tabs>

      <div className="mt-4">
        {activeTab === 'campus' && (
          <>
            <p className="text-sm text-gray-600 mb-3">Top performers on your campus</p>
            {renderLeaderboard(MOCK_LEADERBOARD)}
          </>
        )}
        {activeTab === 'friends' && (
          <>
            <p className="text-sm text-gray-600 mb-3">Your friends rankings</p>
            {renderLeaderboard(MOCK_LEADERBOARD.slice(0, 5))}
          </>
        )}
        {activeTab === 'global' && (
          <>
            <p className="text-sm text-gray-600 mb-3">Top humans worldwide</p>
            {renderLeaderboard(MOCK_LEADERBOARD)}
          </>
        )}
      </div>
    </div>
  );
};
