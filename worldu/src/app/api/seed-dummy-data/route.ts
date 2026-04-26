import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if dummy user already exists
    const existingUser = await User.findOne({ 
      walletAddress: '0x1234567890123456789012345678901234567890' 
    });

    if (existingUser) {
      console.log('Dummy user already exists. Deleting and recreating...');
      await User.deleteOne({ walletAddress: '0x1234567890123456789012345678901234567890' });
    }

    // Create dummy user
    const dummyUser = await User.create({
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'dummy_human',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dummy',
      totalPoints: 350,
      currentStreak: 3,
      completedQuests: ['walk-10', 'meditate-no-phone'],
      badges: [
        {
          id: 'first-quest',
          name: 'First Steps',
          icon: 'dash-flag',
          unlockedAt: new Date('2026-04-20')
        },
        {
          id: 'streak-3',
          name: 'On Fire',
          icon: 'fire-flame',
          unlockedAt: new Date('2026-04-23')
        },
        {
          id: 'points-100',
          name: 'Century',
          icon: 'star',
          unlockedAt: new Date('2026-04-22')
        }
      ]
    });

    console.log('Dummy user created successfully:', dummyUser);

    return NextResponse.json({
      success: true,
      message: 'Dummy data seeded successfully',
      data: {
        username: dummyUser.username,
        totalPoints: dummyUser.totalPoints,
        completedQuests: dummyUser.completedQuests,
        badges: dummyUser.badges.length
      }
    });

  } catch (error) {
    console.error('Error seeding dummy data:', error);
    return NextResponse.json(
      { error: 'Failed to seed dummy data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
