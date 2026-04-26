import mongoose from 'mongoose';
import { User } from '../src/models/User';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

async function seedDummyData() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/worldu';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
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
          icon: '🎯',
          unlockedAt: new Date('2026-04-20')
        },
        {
          id: 'streak-3',
          name: 'On Fire',
          icon: '🔥',
          unlockedAt: new Date('2026-04-23')
        },
        {
          id: 'points-100',
          name: 'Century',
          icon: '💯',
          unlockedAt: new Date('2026-04-22')
        }
      ]
    });

    console.log('Dummy user created successfully:', dummyUser);
    console.log('Username:', dummyUser.username);
    console.log('Total Points:', dummyUser.totalPoints);
    console.log('Completed Quests:', dummyUser.completedQuests);
    console.log('Badges:', dummyUser.badges.length);

  } catch (error) {
    console.error('Error seeding dummy data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDummyData();
