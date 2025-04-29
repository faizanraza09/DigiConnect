const mongoose = require('mongoose');
const Pickup = require('../models/Pickup');

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://admin:admin@localhost:27017/recycleconnect?authSource=admin&directConnection=true', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Create the 2dsphere index on the location field
    await Pickup.collection.createIndex({ location: '2dsphere' });
    console.log('Created 2dsphere index on location field');

    // Verify the index was created
    const indexes = await Pickup.collection.indexes();
    console.log('Current indexes:', indexes);

    console.log('Index creation completed successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createIndexes(); 