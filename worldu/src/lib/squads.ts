import type { ISquad } from '@/models/Squad';

export const SQUAD_INVITE_CODE_LENGTH = 6;
export const SQUAD_WEEKLY_GOAL_DEFAULT = 500;
export const SQUAD_WEEKLY_BONUS_PER_MEMBER = 50;

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = SQUAD_INVITE_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

/**
 * Returns whether the squad's weekly window has expired (rolling 7 days).
 */
export function isWeekExpired(weekStartedAt: Date | string, now: Date = new Date()): boolean {
  const start = new Date(weekStartedAt).getTime();
  const elapsed = now.getTime() - start;
  return elapsed >= 7 * 24 * 60 * 60 * 1000;
}

/**
 * Reset weekly counters on a squad if the week window has expired. Mutates the
 * squad document in place. Returns true if a reset happened.
 */
export function resetWeeklyIfExpired(squad: ISquad, now: Date = new Date()): boolean {
  if (!isWeekExpired(squad.weekStartedAt, now)) return false;

  squad.weeklyPoints = 0;
  squad.weekStartedAt = now;
  squad.members.forEach((m) => {
    m.weeklyContributedPoints = 0;
  });
  return true;
}

export function summarizeSquad(squad: ISquad) {
  return {
    id: squad._id?.toString?.() ?? String(squad._id),
    name: squad.name,
    tag: squad.tag,
    emoji: squad.emoji,
    bannerColor: squad.bannerColor,
    description: squad.description ?? '',
    inviteCode: squad.inviteCode,
    ownerId: squad.ownerId,
    totalPoints: squad.totalPoints,
    weeklyPoints: squad.weeklyPoints,
    weeklyGoal: squad.weeklyGoal,
    weekStartedAt: squad.weekStartedAt,
    weeklyGoalsHit: squad.weeklyGoalsHit,
    members: squad.members.map((m) => ({
      walletAddress: m.walletAddress,
      username: m.username,
      role: m.role,
      joinedAt: m.joinedAt,
      contributedPoints: m.contributedPoints,
      weeklyContributedPoints: m.weeklyContributedPoints,
    })),
    memberCount: squad.members.length,
  };
}
