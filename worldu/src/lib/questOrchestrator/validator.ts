'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ValidationInput {
  imageBase64: string;
  gpsCoordinates: { latitude: number; longitude: number };
  questDescription: string;
  questVerificationHint: string;
  targetArea?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    name: string;
  };
}

export interface ValidationResult {
  verified: boolean;
  imageMatch: {
    matches: boolean;
    confidence: number;
    explanation: string;
  };
  liveness: {
    isLive: boolean;
    confidence: number;
    explanation: string;
  };
  gpsCheck: {
    withinRange: boolean;
    distanceMeters: number | null;
    explanation: string;
  };
  overallExplanation: string;
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
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Server action: Validate a quest completion using Gemini Vision.
 *
 * 1. Confirms the image matches the quest description.
 * 2. Checks for "liveness" (no screens or recycled photos).
 * 3. Cross-references GPS with the target quest area.
 */
export async function validateQuestCompletion(
  input: ValidationInput
): Promise<ValidationResult> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // Strip data URL prefix if present
  let base64Data = input.imageBase64;
  let mimeType = 'image/jpeg';
  if (base64Data.includes(',')) {
    const prefix = base64Data.split(',')[0];
    if (prefix.includes('png')) mimeType = 'image/png';
    else if (prefix.includes('webp')) mimeType = 'image/webp';
    base64Data = base64Data.split(',')[1];
  }

  const prompt = buildValidationPrompt(input);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  });

  const responseText = result.response.text().trim();

  let visionResult: Record<string, unknown>;
  try {
    visionResult = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      visionResult = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse Gemini Vision response: ${responseText.slice(0, 200)}`);
    }
  }

  // GPS cross-reference
  const gpsCheck = evaluateGps(input);

  const imageMatches = Boolean(visionResult.image_matches);
  const imageConfidence = Number(visionResult.image_confidence) || 0;
  const isLive = Boolean(visionResult.is_live);
  const livenessConfidence = Number(visionResult.liveness_confidence) || 0;

  const verified = imageMatches && isLive && gpsCheck.withinRange;

  return {
    verified,
    imageMatch: {
      matches: imageMatches,
      confidence: imageConfidence,
      explanation: String(visionResult.image_explanation || ''),
    },
    liveness: {
      isLive,
      confidence: livenessConfidence,
      explanation: String(visionResult.liveness_explanation || ''),
    },
    gpsCheck,
    overallExplanation: verified
      ? 'Quest completion verified successfully.'
      : buildFailureExplanation(imageMatches, isLive, gpsCheck.withinRange),
  };
}

function buildValidationPrompt(input: ValidationInput): string {
  return `You are a strict quest verification system for WorldU, a real-world self-improvement app.
Analyze this image against the quest requirements.

QUEST DESCRIPTION: ${input.questDescription}
VERIFICATION HINT: ${input.questVerificationHint}

You must evaluate TWO things:

1. IMAGE MATCH: Does the image genuinely show evidence of completing the described quest?
   - Look for specific elements mentioned in the verification hint.
   - Be strict — the image must clearly relate to the quest.

2. LIVENESS CHECK: Is this a real, freshly-taken photo?
   - REJECT if the image shows a phone screen, computer monitor, TV, or any digital display showing another image.
   - REJECT if the image appears to be a screenshot or photo of a photo.
   - REJECT if the image has clear signs of being recycled (e.g., visible screen bezels, moiré patterns, screen reflections, pixelation from screen capture).
   - ACCEPT if the image appears to be a direct camera capture of a real-world scene.

Respond with ONLY a JSON object in this exact format:
{
  "image_matches": true/false,
  "image_confidence": 0.0-1.0,
  "image_explanation": "What you see in the image and why it does/doesn't match",
  "is_live": true/false,
  "liveness_confidence": 0.0-1.0,
  "liveness_explanation": "Why you believe this is/isn't a live photo"
}`;
}

function evaluateGps(input: ValidationInput): {
  withinRange: boolean;
  distanceMeters: number | null;
  explanation: string;
} {
  if (!input.targetArea) {
    return {
      withinRange: true,
      distanceMeters: null,
      explanation: 'No target area specified; GPS check skipped.',
    };
  }

  const distance = haversineDistance(
    input.gpsCoordinates.latitude,
    input.gpsCoordinates.longitude,
    input.targetArea.latitude,
    input.targetArea.longitude
  );

  const withinRange = distance <= input.targetArea.radiusMeters;

  return {
    withinRange,
    distanceMeters: Math.round(distance),
    explanation: withinRange
      ? `User is ${Math.round(distance)}m from "${input.targetArea.name}" (within ${input.targetArea.radiusMeters}m radius).`
      : `User is ${Math.round(distance)}m from "${input.targetArea.name}" (outside ${input.targetArea.radiusMeters}m radius).`,
  };
}

function buildFailureExplanation(
  imageOk: boolean,
  livenessOk: boolean,
  gpsOk: boolean
): string {
  const failures: string[] = [];
  if (!imageOk) failures.push('Image does not match the quest description');
  if (!livenessOk) failures.push('Image failed liveness check (possible screen/recycled photo)');
  if (!gpsOk) failures.push('GPS location is outside the target quest area');
  return `Verification failed: ${failures.join('; ')}.`;
}
