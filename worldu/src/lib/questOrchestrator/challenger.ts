import { GoogleGenerativeAI } from '@google/generative-ai';
import { HabitSummary } from './historian';

export interface CatalystQuest {
  title: string;
  description: string;
  category: string;
  difficulty: 'moderate' | 'hard' | 'extreme';
  estimatedMinutes: number;
  verificationHint: string;
  targetArea?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    name: string;
  };
  reasoning: string;
}

const GEMINI_MODEL = 'gemini-3-flash-preview';

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate a "Quest of the Day" Catalyst using Gemini 1.5 Flash.
 * Takes the Historian's habit summary and the user's current location
 * to propose a harder or different version of their usual habit.
 */
export async function generateCatalystQuest(
  habitSummary: HabitSummary,
  userLocation: { latitude: number; longitude: number }
): Promise<CatalystQuest> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = buildCatalystPrompt(habitSummary, userLocation);

  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text().trim();
      return parseGeminiResponse(responseText);
    } catch (err) {
      lastError = err;
      const isRetryable = err instanceof Error && (err.message.includes('503') || err.message.includes('429') || err.message.includes('overloaded'));
      if (isRetryable && attempt < MAX_RETRIES - 1) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.log(`[Challenger] Gemini ${err instanceof Error ? err.message.slice(0, 60) : '503'} — retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

function parseGeminiResponse(responseText: string): CatalystQuest {

  try {
    const parsed = JSON.parse(responseText);
    return validateCatalystResponse(parsed);
  } catch (firstError) {
    // Attempt to extract JSON from markdown fences or partial response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateCatalystResponse(parsed);
      } catch {
        // JSON might be truncated — try to repair by closing open strings/braces
        const repaired = repairTruncatedJson(jsonMatch[0]);
        const parsed = JSON.parse(repaired);
        return validateCatalystResponse(parsed);
      }
    }
    throw new Error(`Failed to parse Gemini response as JSON: ${responseText.slice(0, 300)}`);
  }
}

function buildCatalystPrompt(
  summary: HabitSummary,
  location: { latitude: number; longitude: number }
): string {
  const comfortZoneInfo =
    summary.comfortZones.length > 0
      ? `The user is in a COMFORT ZONE with these categories: ${summary.comfortZones.join(', ')}. They repeatedly do quests in these areas.`
      : 'The user has no strong comfort zone yet.';

  const neglectedInfo =
    summary.neglectedCategories.length > 0
      ? `They NEGLECT these categories: ${summary.neglectedCategories.join(', ')}. Push them toward these.`
      : 'They have tried all categories.';

  const recentQuestsInfo =
    summary.recentCompletions.length > 0
      ? `Recent quests: ${summary.recentCompletions.map((q) => `${q.questTitle} (${q.questCategory})`).join(', ')}`
      : 'No recent quests completed.';

  return `You are the Quest Challenger for a real-world self-improvement app called WorldU.
Your job is to generate a single "Catalyst Quest of the Day" that pushes the user OUT of their comfort zone.

USER HABIT ANALYSIS (last 10 quests):
- Total completions: ${summary.totalCompletions}
- ${comfortZoneInfo}
- ${neglectedInfo}
- ${recentQuestsInfo}
- Category breakdown: ${JSON.stringify(summary.categoryCounts)}
- Average points per quest: ${summary.averagePointsPerQuest}
- Dominant category: ${summary.dominantCategory || 'none'}

USER LOCATION:
- Latitude: ${location.latitude}
- Longitude: ${location.longitude}

RULES:
1. The quest MUST be completable in the real world near the user's location.
2. If the user has a comfort zone, generate a quest in a DIFFERENT category (preferably a neglected one).
3. The quest should be a harder or more creative variation compared to what they usually do.
4. Categories: movement, community, mindfulness, service, discomfort, daily.
5. The "discomfort" category is for quests that push social or personal boundaries (e.g., giving a compliment to a stranger, cold exposure, public speaking).
6. Include a verification hint describing what a photo proof should show.
7. Suggest a target area near the user's coordinates with a reasonable radius.

Respond with ONLY a JSON object in this exact format:
{
  "title": "Quest title",
  "description": "Detailed description of the quest",
  "category": "one of: movement, community, mindfulness, service, discomfort, daily",
  "difficulty": "one of: moderate, hard, extreme",
  "estimatedMinutes": <number>,
  "verificationHint": "What a photo proof should show to verify completion",
  "targetArea": {
    "latitude": <number near user>,
    "longitude": <number near user>,
    "radiusMeters": <number>,
    "name": "Area description"
  },
  "reasoning": "Why this quest was chosen based on the user's habits"
}`;
}

function repairTruncatedJson(raw: string): string {
  let s = raw;
  // Close any unterminated string
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';
  // Balance braces and brackets
  const open = (s.match(/\{/g) || []).length;
  const close = (s.match(/\}/g) || []).length;
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;
  s += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
  s += '}'.repeat(Math.max(0, open - close));
  return s;
}

function validateCatalystResponse(parsed: Record<string, unknown>): CatalystQuest {
  const validCategories = ['movement', 'community', 'mindfulness', 'service', 'discomfort', 'daily'];
  const validDifficulties = ['moderate', 'hard', 'extreme'];

  const category = String(parsed.category || 'discomfort');
  const difficulty = String(parsed.difficulty || 'moderate');

  return {
    title: String(parsed.title || 'Mystery Catalyst'),
    description: String(parsed.description || 'Push your boundaries today.'),
    category: validCategories.includes(category) ? category : 'discomfort',
    difficulty: validDifficulties.includes(difficulty)
      ? (difficulty as CatalystQuest['difficulty'])
      : 'moderate',
    estimatedMinutes: Number(parsed.estimatedMinutes) || 30,
    verificationHint: String(parsed.verificationHint || 'Take a photo showing quest completion.'),
    targetArea: parsed.targetArea
      ? {
          latitude: Number((parsed.targetArea as Record<string, unknown>).latitude) || 0,
          longitude: Number((parsed.targetArea as Record<string, unknown>).longitude) || 0,
          radiusMeters: Number((parsed.targetArea as Record<string, unknown>).radiusMeters) || 500,
          name: String((parsed.targetArea as Record<string, unknown>).name || 'Nearby area'),
        }
      : undefined,
    reasoning: String(parsed.reasoning || ''),
  };
}
