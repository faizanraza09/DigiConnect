const mongoose = require('mongoose');
const User = require('../models/User');
const RecyclingHistory = require('../models/RecyclingHistory');
require('dotenv').config();

const users = [
  {
    username: 'eco_warrior',
    email: 'eco@example.com',
    password: '$2b$10$YourHashedPasswordHere', // This should be properly hashed in production
    points: 1500,
    role: 'user',
    recyclingStats: {
      totalRecycled: 45.5,
      materialsRecycled: {
        plastic: 20.5,
        paper: 15.0,
        glass: 5.0,
        metal: 5.0
      }
    }
  },
  {
    username: 'green_hero',
    email: 'green@example.com',
    password: '$2b$10$YourHashedPasswordHere',
    points: 2500,
    role: 'user',
    recyclingStats: {
      totalRecycled: 75.0,
      materialsRecycled: {
        plastic: 30.0,
        paper: 25.0,
        glass: 10.0,
        metal: 10.0
      }
    }
  }
];

const recyclingHistory = [
  {
    userId: null, // Will be set after user creation
    materialId: null, // Will be set after material creation
    quantity: 5.5,
    pointsEarned: 275,
    date: new Date('2024-03-01')
  },
  {
    userId: null,
    materialId: null,
    quantity: 3.0,
    pointsEarned: 150,
    date: new Date('2024-03-05')
  },
  {
    userId: null,
    materialId: null,
    quantity: 7.5,
    pointsEarned: 375,
    date: new Date('2024-03-10')
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:admin@localhost:27017/recycleconnect?authSource=admin&directConnection=true');
    
    // Clear existing data
    await User.deleteMany({});
    await RecyclingHistory.deleteMany({});
    
    // Insert users
    const createdUsers = await User.insertMany(users);
    
    // Get materials for reference
    const materials = await mongoose.model('Material').find({});
    
    // Create recycling history entries
    const historyEntries = recyclingHistory.map((entry, index) => ({
      ...entry,
      userId: createdUsers[index % createdUsers.length]._id,
      materialId: materials[index % materials.length]._id
    }));
    
    await RecyclingHistory.insertMany(historyEntries);
    
    console.log('Users and recycling history seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers(); 