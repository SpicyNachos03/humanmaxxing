'use client';

import { useEffect, useState } from 'react';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession } from 'next-auth/react';

interface SquadMember {
  walletAddress: string;
  username: string;
  role: 'owner' | 'member';
  contributedPoints: number;
  weeklyContributedPoints: number;
}

interface Squad {
  id: string;
  name: string;
  tag: string;
  emoji: string;
  bannerColor: string;
  description: string;
  inviteCode: string;
  ownerId: string;
  totalPoints: number;
  weeklyPoints: number;
  weeklyGoal: number;
  weeklyGoalsHit: number;
  members: SquadMember[];
  memberCount: number;
}

export const SquadContent = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [squad, setSquad] = useState<Squad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create form state
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🛡️');
  const [weeklyGoal, setWeeklyGoal] = useState('500');

  // Join form state
  const [inviteCode, setInviteCode] = useState('');

  const myWallet = session?.user?.walletAddress;

  const fetchSquad = async () => {
    try {
      const res = await fetch('/api/squads/me', { cache: 'no-store' });
      const data = await res.json();
      setSquad(data.squad ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquad();
  }, []);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/squads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tag, description, emoji, weeklyGoal: Number(weeklyGoal) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create squad');
      setSquad(data.squad);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/squads/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join squad');
      setSquad(data.squad);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this squad? Your contributions will stay.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/squads/leave', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to leave squad');
      }
      setSquad(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!squad?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(squad.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full h-32 skeleton rounded-xl mb-4" />
        <div className="w-full h-24 skeleton rounded-xl" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="w-full space-y-6 animate-fade-in">
        <div className="rounded-2xl p-5 border-2 border-green-100 bg-green-50">
          <h2 className="text-xl font-bold mb-1">Join your friends</h2>
          <p className="text-sm text-gray-600">
            Create or join a squad to chase weekly goals together. Hit the goal and
            every member earns a bonus.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-gray-200 p-4">
          <h3 className="font-semibold mb-3">Join with invite code</h3>
          <div className="flex gap-2">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={8}
              className="flex-1 border-2 border-gray-200 rounded-xl pl-5 pr-3 py-2 text-sm font-mono uppercase tracking-widest"
            />
            <Button
              onClick={handleJoin}
              disabled={!inviteCode || busy}
              size="sm"
              variant="primary"
            >
              Join
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold">Create a new squad</h3>

          <div>
            <label className="text-xs text-gray-500">Squad name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full border-2 border-gray-200 rounded-xl pl-5 pr-3 py-2 text-sm mt-1"
              placeholder="The Quest Crusaders"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Tag (2–5)</label>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                maxLength={5}
                className="w-full border-2 border-gray-200 rounded-xl pl-5 pr-3 py-2 text-sm uppercase mt-1"
                placeholder="QC"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Emoji</label>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="w-full border-2 border-gray-200 rounded-xl pl-5 pr-3 py-2 text-lg text-center mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className="w-full border-2 border-gray-200 rounded-xl pl-5 pr-3 py-2 text-sm mt-1"
              placeholder="What's your squad about?"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Weekly goal (points)</label>
            <input
              type="number"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              min={50}
              max={5000}
              step={50}
              className="w-full border-2 border-gray-200 rounded-xl pl-5 pr-3 py-2 text-sm mt-1"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name || tag.length < 2 || busy}
            size="lg"
            variant="primary"
            className="w-full"
          >
            Create Squad
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  const goalProgress = Math.min(
    100,
    Math.round((squad.weeklyPoints / Math.max(1, squad.weeklyGoal)) * 100)
  );
  const isOwner = squad.ownerId === myWallet;

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div
        className="rounded-2xl p-5 text-white"
        style={{ background: squad.bannerColor }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{squad.emoji}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{squad.name}</h2>
            <p className="text-xs uppercase tracking-widest opacity-90">
              [{squad.tag}] · {squad.memberCount} member{squad.memberCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {squad.description ? (
          <p className="text-sm mt-2 opacity-90">{squad.description}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Weekly Goal</h3>
          <span className="text-xs text-gray-500">
            {squad.weeklyPoints} / {squad.weeklyGoal} pts
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${goalProgress}%`,
              backgroundColor: squad.bannerColor,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {squad.weeklyGoalsHit > 0
            ? `Goal hit ${squad.weeklyGoalsHit}× this week 🎉 every member earned a bonus.`
            : 'Hit the goal together — every member earns a bonus.'}
        </p>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Invite friends</h3>
          <button
            onClick={copyInvite}
            className="text-xs text-green-600 font-semibold"
          >
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <div className="rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] uppercase">
          {squad.inviteCode}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Members ({squad.memberCount})</h3>
        <div className="space-y-2">
          {[...squad.members]
            .sort((a, b) => b.weeklyContributedPoints - a.weeklyContributedPoints)
            .map((m) => {
              const isMe = m.walletAddress === myWallet;
              return (
                <div
                  key={m.walletAddress}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isMe ? 'bg-green-50 border-2 border-green-300' : 'border border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold uppercase">
                      {m.username?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold capitalize truncate ${isMe ? 'text-green-700' : ''}`}>
                        {isMe ? `${m.username} (You)` : m.username}
                        {m.role === 'owner' && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                            Owner
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.contributedPoints} total pts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">
                      +{m.weeklyContributedPoints}
                    </p>
                    <p className="text-[10px] uppercase text-gray-400">this week</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleLeave}
        disabled={busy}
        size="lg"
        variant="secondary"
        className="w-full"
      >
        {isOwner && squad.memberCount > 1
          ? 'Leave squad (transfers ownership)'
          : 'Leave squad'}
      </Button>
    </div>
  );
};
