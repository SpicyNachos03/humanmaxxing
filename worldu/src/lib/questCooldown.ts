export const QUEST_COOLDOWN_HOURS = 24;
export const QUEST_COOLDOWN_MS = QUEST_COOLDOWN_HOURS * 60 * 60 * 1000;

export interface QuestCompletionRecord {
  questId: string;
  completedAt: Date | string;
}

/**
 * Returns the remaining cooldown for a quest in hours (rounded up).
 * Returns null if the quest is not on cooldown.
 */
export function getQuestCooldownRemainingHours(
  questId: string,
  questCompletions: QuestCompletionRecord[] | undefined | null,
  now: Date = new Date()
): number | null {
  if (!questCompletions || questCompletions.length === 0) return null;

  const lastCompletion = questCompletions.find((qc) => qc.questId === questId);
  if (!lastCompletion) return null;

  const completedAt = new Date(lastCompletion.completedAt).getTime();
  const elapsedMs = now.getTime() - completedAt;

  if (elapsedMs >= QUEST_COOLDOWN_MS) return null;

  const remainingMs = QUEST_COOLDOWN_MS - elapsedMs;
  return Math.ceil(remainingMs / (60 * 60 * 1000));
}

/**
 * Returns the Date at which the cooldown will end, or null if not on cooldown.
 */
export function getQuestCooldownEnd(
  questId: string,
  questCompletions: QuestCompletionRecord[] | undefined | null,
  now: Date = new Date()
): Date | null {
  if (!questCompletions || questCompletions.length === 0) return null;

  const lastCompletion = questCompletions.find((qc) => qc.questId === questId);
  if (!lastCompletion) return null;

  const completedAt = new Date(lastCompletion.completedAt).getTime();
  const cooldownEnd = completedAt + QUEST_COOLDOWN_MS;

  if (cooldownEnd <= now.getTime()) return null;

  return new Date(cooldownEnd);
}
