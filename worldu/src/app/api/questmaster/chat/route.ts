import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import { getUserHabitSummary } from '@/lib/questOrchestrator/historian';
import { generateCatalystQuest } from '@/lib/questOrchestrator/challenger';
import { validateQuestCompletion } from '@/lib/questOrchestrator/validator';
import { GoogleGenerativeAI } from '@google/generative-ai';

const LOG_PREFIX = '[QuestMaster]';
const GEMINI_MODEL = 'gemini-3-flash-preview';

function log(agent: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `${LOG_PREFIX} [${agent}] ${timestamp}`;
  if (data !== undefined) {
    console.log(`${prefix} — ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} — ${message}`);
  }
}

type Intent = 'get_quest' | 'verify_quest' | 'check_habits' | 'general_chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function classifyIntent(userMessage: string): Promise<Intent> {
  log('Orchestrator', `Classifying intent for: "${userMessage.slice(0, 100)}"`);

  const lower = userMessage.toLowerCase();

  if (lower.match(/verif|submit|proof|photo|image|complet.*quest|done|finish/)) {
    log('Orchestrator', 'Intent classified → verify_quest');
    return 'verify_quest';
  }
  if (lower.match(/quest|challenge|catalyst|today|new.*mission|give.*me|suggest|recommend|push.*me|what.*should/)) {
    log('Orchestrator', 'Intent classified → get_quest');
    return 'get_quest';
  }
  if (lower.match(/habit|history|pattern|comfort|zone|summary|analyz|progress|streak|stat/)) {
    log('Orchestrator', 'Intent classified → check_habits');
    return 'check_habits';
  }

  log('Orchestrator', 'Intent classified → general_chat');
  return 'general_chat';
}

async function handleGetQuest(
  walletAddress: string,
  location: { latitude: number; longitude: number } | null
): Promise<string> {
  log('Orchestrator', '▶ Dispatching to Historian + Challenger pipeline');

  // Step 1: Historian
  log('Historian', 'Fetching habit summary...', { walletAddress });
  const habitSummary = await getUserHabitSummary(walletAddress);
  log('Historian', 'Habit summary retrieved', {
    totalCompletions: habitSummary.totalCompletions,
    comfortZones: habitSummary.comfortZones,
    neglectedCategories: habitSummary.neglectedCategories,
    dominantCategory: habitSummary.dominantCategory,
    categoryCounts: habitSummary.categoryCounts,
  });

  // Step 2: Challenger
  const userLoc = location || { latitude: 37.7749, longitude: -122.4194 };
  log('Challenger', 'Generating Catalyst quest...', { location: userLoc });

  const catalyst = await generateCatalystQuest(habitSummary, userLoc);
  log('Challenger', 'Catalyst quest generated ✓', {
    title: catalyst.title,
    category: catalyst.category,
    difficulty: catalyst.difficulty,
    estimatedMinutes: catalyst.estimatedMinutes,
  });
  log('Challenger', 'Full catalyst response', catalyst);

  // Format response
  const difficultyEmoji = { moderate: '🟡', hard: '🟠', extreme: '🔴' };
  const emoji = difficultyEmoji[catalyst.difficulty] || '🟡';

  let response = `## ${emoji} Your Catalyst Quest\n\n`;
  response += `**${catalyst.title}**\n\n`;
  response += `${catalyst.description}\n\n`;
  response += `- **Category:** ${catalyst.category}\n`;
  response += `- **Difficulty:** ${catalyst.difficulty}\n`;
  response += `- **Time:** ~${catalyst.estimatedMinutes} min\n`;
  if (catalyst.targetArea) {
    response += `- **Where:** ${catalyst.targetArea.name}\n`;
  }
  response += `\n📸 **To verify:** ${catalyst.verificationHint}\n`;
  response += `\n💡 *${catalyst.reasoning}*`;

  if (habitSummary.comfortZones.length > 0) {
    response += `\n\n---\n🔍 I noticed you tend to stick to **${habitSummary.comfortZones.join(', ')}** quests. This one is designed to push you into new territory!`;
  }

  return response;
}

async function handleCheckHabits(walletAddress: string): Promise<string> {
  log('Orchestrator', '▶ Dispatching to Historian for habit analysis');

  log('Historian', 'Fetching habit summary...', { walletAddress });
  const summary = await getUserHabitSummary(walletAddress);
  log('Historian', 'Habit summary complete', summary);

  if (summary.totalCompletions === 0) {
    return "You haven't completed any quests yet! Head to the **Quests** tab and finish one, then come back and I'll analyze your patterns. 🚀";
  }

  let response = `## 📊 Your Habit Analysis\n\n`;
  response += `Based on your last **${summary.totalCompletions}** quests:\n\n`;

  // Category breakdown
  response += `**Category Breakdown:**\n`;
  for (const [cat, count] of Object.entries(summary.categoryCounts)) {
    const bar = '█'.repeat(count) + '░'.repeat(Math.max(0, summary.totalCompletions - count));
    response += `- ${cat}: ${bar} (${count})\n`;
  }

  // Comfort zones
  if (summary.comfortZones.length > 0) {
    response += `\n⚠️ **Comfort Zones Detected:** ${summary.comfortZones.join(', ')}\n`;
    response += `You're repeating these categories a lot. Time to branch out!\n`;
  }

  // Neglected
  if (summary.neglectedCategories.length > 0) {
    response += `\n🚫 **Neglected Categories:** ${summary.neglectedCategories.join(', ')}\n`;
    response += `Try tackling one of these next!\n`;
  }

  response += `\n**Average points per quest:** ${summary.averagePointsPerQuest}\n`;
  response += `\nWant me to generate a **Catalyst Quest** to push your limits? Just ask! 💪`;

  return response;
}

async function handleVerifyQuest(
  userMessage: string,
  imageBase64: string | null,
  location: { latitude: number; longitude: number } | null
): Promise<string> {
  log('Orchestrator', '▶ Dispatching to Validator for quest verification');

  if (!imageBase64) {
    log('Validator', 'No image provided — asking user to attach one');
    return "I need a photo to verify your quest! 📸\n\nPlease attach an image of your completed quest and I'll run it through verification.";
  }

  if (!location) {
    log('Validator', 'No GPS coordinates — proceeding without location check');
  }

  log('Validator', 'Running verification pipeline...', {
    hasImage: true,
    imageSize: `${Math.round(imageBase64.length / 1024)}KB`,
    hasLocation: !!location,
  });

  const result = await validateQuestCompletion({
    imageBase64,
    gpsCoordinates: location || { latitude: 0, longitude: 0 },
    questDescription: userMessage,
    questVerificationHint: 'Photo proof of quest completion',
    targetArea: undefined,
  });

  log('Validator', 'Verification result', {
    verified: result.verified,
    imageMatch: result.imageMatch,
    liveness: result.liveness,
    gpsCheck: result.gpsCheck,
  });

  if (result.verified) {
    let response = `## ✅ Quest Verified!\n\n`;
    response += `**Image Match:** ${(result.imageMatch.confidence * 100).toFixed(0)}% confidence\n`;
    response += `> ${result.imageMatch.explanation}\n\n`;
    response += `**Liveness:** ${(result.liveness.confidence * 100).toFixed(0)}% confidence\n`;
    response += `> ${result.liveness.explanation}\n\n`;
    response += `Great job! Your quest has been verified. 🎉`;
    return response;
  }

  let response = `## ❌ Verification Failed\n\n`;
  if (!result.imageMatch.matches) {
    response += `**Image Match:** Failed\n> ${result.imageMatch.explanation}\n\n`;
  }
  if (!result.liveness.isLive) {
    response += `**Liveness Check:** Failed\n> ${result.liveness.explanation}\n\n`;
  }
  if (!result.gpsCheck.withinRange) {
    response += `**GPS Check:** Failed\n> ${result.gpsCheck.explanation}\n\n`;
  }
  response += `Please try again with a fresh photo taken at the quest location.`;
  return response;
}

async function handleGeneralChat(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  log('Orchestrator', '▶ Handling as general Quest Master chat');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "I'm having trouble connecting to my brain right now. Please try again in a moment! 🧠";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const systemPrompt = `You are the Quest Master for WorldU, a real-world self-improvement app.
You are an encouraging, slightly intense personal growth coach. Keep responses concise and action-oriented.
You can help users with:
- Getting a new quest (tell them to ask for a "catalyst quest" or "quest of the day")
- Checking their habit patterns (tell them to ask about their "habits" or "progress")
- Verifying quest completion (tell them to attach a photo)
- General motivation and guidance about self-improvement

Stay in character. Be motivating but not annoying. Use emojis sparingly.`;

  const contents = [
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: 'Understood. I am the Quest Master. Ready to push humans beyond their limits.' }] },
    ...history.slice(-6).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  log('Orchestrator', 'Sending to Gemini for general chat', {
    historyLength: history.length,
    messagePreview: userMessage.slice(0, 80),
  });

  const result = await model.generateContent({ contents });
  const response = result.response.text().trim();

  log('Orchestrator', 'Gemini chat response received', {
    responseLength: response.length,
  });

  return response;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  log('Orchestrator', '═══════════════════════════════════════════');
  log('Orchestrator', '▶ New Quest Master request received');

  try {
    await connectDB();

    const session = await auth();
    if (!session?.user?.walletAddress) {
      log('Orchestrator', '✗ Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const walletAddress = session.user.walletAddress;
    log('Orchestrator', `User: ${walletAddress.slice(0, 10)}...`);

    const body = await request.json();
    const {
      message,
      history = [],
      location = null,
      imageBase64 = null,
    }: {
      message: string;
      history: ChatMessage[];
      location: { latitude: number; longitude: number } | null;
      imageBase64: string | null;
    } = body;

    log('Orchestrator', 'Request payload', {
      message: message.slice(0, 100),
      historyLength: history.length,
      hasLocation: !!location,
      hasImage: !!imageBase64,
    });

    // Classify intent
    const intent = await classifyIntent(message);
    log('Orchestrator', `Intent: ${intent}`);

    let reply: string;

    switch (intent) {
      case 'get_quest':
        reply = await handleGetQuest(walletAddress, location);
        break;
      case 'check_habits':
        reply = await handleCheckHabits(walletAddress);
        break;
      case 'verify_quest':
        reply = await handleVerifyQuest(message, imageBase64, location);
        break;
      case 'general_chat':
      default:
        reply = await handleGeneralChat(message, history);
        break;
    }

    const elapsed = Date.now() - startTime;
    log('Orchestrator', `✓ Response ready in ${elapsed}ms`);
    log('Orchestrator', '═══════════════════════════════════════════\n');

    return NextResponse.json({
      reply,
      intent,
      elapsed,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    log('Orchestrator', `✗ Error after ${elapsed}ms`, {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`${LOG_PREFIX} Full error:`, error);
    return NextResponse.json(
      { error: 'Quest Master encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}
