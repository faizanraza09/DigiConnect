const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:admin@localhost:27017/recycleconnect?authSource=admin&directConnection=true');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@recycleconnect.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@recycleconnect.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      userType: 'recycler', // Admin can be either type, but needs a type for the app's functionality
      role: 'admin', // This gives admin privileges
      phoneNumber: '1234567890', // Required field
      location: {
        coordinates: [0, 0], // Default coordinates
        address: 'Admin Location'
      }
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@recycleconnect.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin(); 