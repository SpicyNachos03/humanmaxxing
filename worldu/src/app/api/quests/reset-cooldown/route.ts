import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

/**
 * TEST ONLY: Reset quest cooldown for all users
 * This endpoint is for development/testing purposes only
 * WARNING: This clears quest completions for ALL users
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Clear quest completions for all users
    const result = await User.updateMany(
      {},
      { $set: { questCompletions: [] } }
    );

    return NextResponse.json({
      success: true,
      message: `Quest cooldown reset for ${result.modifiedCount} users`,
    });
  } catch (error) {
    console.error('Error resetting cooldown:', error);
    return NextResponse.json(
      { error: 'Failed to reset cooldown' },
      { status: 500 }
    );
  }
}
