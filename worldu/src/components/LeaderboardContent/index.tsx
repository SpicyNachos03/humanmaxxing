'use client';

import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '@/types/quest';
import { Medal1st, Medal, Trophy } from 'iconoir-react';
import { ReactNode } from 'react';

const medalIcons: ReactNode[] = [
  <Medal1st key="1st" className="w-6 h-6 text-green-600" />,
  <Medal key="2nd" className="w-6 h-6 text-green-400" />,
  <Medal key="3rd" className="w-6 h-6 text-green-300" />,
];

interface SquadEntry {
  rank: number;
  id: string;
  name: string;
  tag: string;
  emoji: string;
  bannerColor: string;
  totalPoints: number;
  weeklyPoints: number;
  weeklyGoal: number;
  memberCount: number;
}

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

type Mode = 'players' | 'squads';
type Range = 'all' | 'weekly';

export const LeaderboardContent = () => {
  const { data: session } = useSession();
  const [mode, setMode] = useState<Mode>('players');
  const [range, setRange] = useState<Range>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [squads, setSquads] = useState<SquadEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (mode === 'players') {
          const response = await fetch('/api/leaderboard', { cache: 'no-store' });
          const data = await response.json();
          if (!cancelled) setLeaderboard(data.leaderboard || []);
        } else {
          const response = await fetch(`/api/squads/leaderboard?range=${range}`, {
            cache: 'no-store',
          });
          const data = await response.json();
          if (!cancelled) setSquads(data.leaderboard || []);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [mode, range]);

  const currentUserId = session?.user?.walletAddress;

  const renderPodium = (top3: LeaderboardEntry[]) => {
    if (top3.length === 0) return null;
    const order = [1, 0, 2];
    const heights = ['h-20', 'h-28', 'h-16'];
    const podiumColors = ['#86efac', '#22c55e', '#dcfce7'];

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
                <span className="text-lg font-bold" style={{ color: '#000000' }}>{entry.rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlayersList = (data: LeaderboardEntry[]) => {
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

  const renderSquads = (data: SquadEntry[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700 mb-1">No squads yet</p>
          <p className="text-sm text-gray-400">Create one and invite your friends!</p>
        </div>
      );
    }

    return (
      <div className="w-full space-y-2">
        {data.map((entry) => {
          const points = range === 'weekly' ? entry.weeklyPoints : entry.totalPoints;
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: entry.bannerColor }}
                >
                  {entry.rank}
                </div>
                <span className="text-2xl">{entry.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.name}{' '}
                    <span className="text-xs text-gray-400 uppercase">[{entry.tag}]</span>
                  </p>
                  <p className="text-xs text-gray-400">{entry.memberCount} members</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-gray-700">{points}</p>
                <p className="text-xs text-gray-400">
                  {range === 'weekly' ? 'this week' : 'total'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col gap-3 mb-4">
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-full">
          <button
            onClick={() => setMode('players')}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              mode === 'players'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setMode('squads')}
            className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
              mode === 'squads'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Squads
          </button>
        </div>

        {mode === 'squads' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setRange('weekly')}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                range === 'weekly'
                  ? 'bg-white text-green-700 shadow-sm border border-green-200'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setRange('all')}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                range === 'all'
                  ? 'bg-white text-green-700 shadow-sm border border-green-200'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All-time
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="w-40 h-5 skeleton mb-2" />
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : mode === 'players' ? (
        leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700 mb-1">No one here yet</p>
            <p className="text-sm text-gray-400">Complete quests to be the first on the leaderboard!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">Top humans worldwide</p>
            {renderPodium(leaderboard.slice(0, 3))}
            {renderPlayersList(leaderboard)}
          </>
        )
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">
            {range === 'weekly' ? 'Top squads this week' : 'Top squads of all time'}
          </p>
          {renderSquads(squads)}
        </>
      )}
    </div>
  );
};
