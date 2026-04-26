'use client';

import { Quest } from '@/types/quest';
import { QuestCard } from '@/components/QuestCard';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { FireFlame, Search } from 'iconoir-react';

interface HomeContentProps {
  quests: Quest[];
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'daily', label: 'Daily' },
  { key: 'movement', label: 'Movement' },
  { key: 'mindfulness', label: 'Mindfulness' },
  { key: 'service', label: 'Service' },
  { key: 'community', label: 'Community' },
] as const;

export const HomeContent = ({ quests }: HomeContentProps) => {
  const { data: session } = useSession();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (session?.user?.walletAddress) {
        try {
          const response = await fetch(
            `/api/user/progress?userId=${session.user.walletAddress}&username=${encodeURIComponent(session.user.username || '')}`
          );
          const data = await response.json();
          setCompletedQuests(data.completedQuests || []);
          setTotalPoints(data.totalPoints || 0);
          setStreak(data.currentStreak || 0);
        } catch (error) {
          console.error('Error fetching progress:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [session]);

  const filteredQuests = activeCategory === 'all'
    ? quests
    : quests.filter((q) => q.category === activeCategory);

  const completedCount = quests.filter((q) => completedQuests.includes(q.id)).length;

  return (
    <div className="w-full animate-fade-in">
      {/* Progress Summary */}
      <div className="rounded-2xl p-4 mb-5 shadow-md bg-brand">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white-force">Today&apos;s Progress</p>
            <p className="text-2xl font-bold mt-0.5 text-black-force">
              {loading ? '—' : `${completedCount}/${quests.length}`}
            </p>
            <p className="text-xs text-white-force">quests completed</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-black-force">{loading ? '—' : totalPoints}</p>
              <p className="text-xs text-white-force">points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold flex items-center gap-1 text-black-force">{loading ? '—' : <>{streak}<FireFlame className="w-5 h-5" /></>}</p>
              <p className="text-xs text-white-force">streak</p>
            </div>
          </div>
        </div>
        {!loading && (
          <div className="mt-3">
            <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500 bg-white-force"
                style={{ width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: isActive ? '#16a34a' : '#f3f4f6',
                color: isActive ? '#ffffff' : '#4b5563',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Quest List */}
      <div className="flex flex-col gap-3">
        {filteredQuests.map((quest, index) => (
          <div
            key={quest.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
          >
            <QuestCard
              quest={quest}
              completed={completedQuests.includes(quest.id)}
            />
          </div>
        ))}
        {filteredQuests.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No quests in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};
