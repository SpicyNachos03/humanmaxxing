import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserHabitSummary } from '@/lib/questOrchestrator/historian';
import { generateCatalystQuest } from '@/lib/questOrchestrator/challenger';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedCatalyst {
  response: Record<string, unknown>;
  createdAt: number;
}

const catalystCache = new Map<string, CachedCatalyst>();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized. Please authenticate first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Location (latitude, longitude) is required.' },
        { status: 400 }
      );
    }

    const walletAddress = session.user.walletAddress;

    // Check cache first
    const cached = catalystCache.get(walletAddress);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      console.log('[Catalyst] Serving cached catalyst for', walletAddress.slice(0, 10) + '...');
      return NextResponse.json(cached.response);
    }

    // Step 1: Get habit summary from the Historian
    const habitSummary = await getUserHabitSummary(walletAddress);

    // No comfort zones → no catalyst needed
    if (habitSummary.comfortZones.length === 0) {
      console.log('[Catalyst] No comfort zones — skipping generation');
      return NextResponse.json({ catalyst: null, habitSummary });
    }

    // Step 2: Generate Catalyst quest from the Challenger
    let catalyst;
    try {
      catalyst = await generateCatalystQuest(habitSummary, {
        latitude,
        longitude,
      });
    } catch (err) {
      console.warn('[Catalyst] Gemini failed, using fallback dummy catalyst:', (err as Error).message?.slice(0, 80));
      const neglected = habitSummary.neglectedCategories[0] || 'discomfort';
      catalyst = {
        title: 'Talk to 7 Strangers',
        description: 'Step outside your comfort zone. Approach 7 different strangers today and start a genuine conversation — ask them about their day, compliment something specific, or ask for a recommendation.',
        category: neglected,
        difficulty: 'hard' as const,
        estimatedMinutes: 60,
        verificationHint: 'Take a selfie at each conversation spot',
        reasoning: `You've been sticking to ${habitSummary.comfortZones.join(' and ')} quests. Time to break out and connect with the world.`,
      };
    }

    const response = {
      catalyst,
      habitSummary: {
        totalCompletions: habitSummary.totalCompletions,
        comfortZones: habitSummary.comfortZones,
        neglectedCategories: habitSummary.neglectedCategories,
        dominantCategory: habitSummary.dominantCategory,
      },
    };

    // Cache for 1 hour
    catalystCache.set(walletAddress, { response, createdAt: Date.now() });
    console.log('[Catalyst] Cached for', walletAddress.slice(0, 10) + '...');

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating catalyst quest:', error);
    return NextResponse.json(
      { error: 'Failed to generate catalyst quest' },
      { status: 500 }
    );
  }
}
