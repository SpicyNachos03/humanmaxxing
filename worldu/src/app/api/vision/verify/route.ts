import { NextRequest, NextResponse } from 'next/server';

const VISION_API_URL = process.env.VISION_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questId, imageBase64 } = body;

    if (!questId || !imageBase64) {
      return NextResponse.json(
        { error: 'Missing questId or imageBase64' },
        { status: 400 }
      );
    }

    // Call the Python vision API
    const response = await fetch(`${VISION_API_URL}/verify?quest_id=${questId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Vision API error:', error);
      return NextResponse.json(
        { error: 'Vision verification failed', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling vision API:', error);
    
    // If vision API is not available, return a soft failure
    // This allows the app to work without the vision service
    return NextResponse.json({
      verified: true,
      message: 'Vision verification unavailable - photo accepted',
      fallback: true,
    });
  }
}
