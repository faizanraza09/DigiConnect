const mongoose = require('mongoose');
const Material = require('../models/Material');
require('dotenv').config();

const materials = [
  {
    name: 'PET Plastic Bottles',
    category: 'plastic',
    pricePerKg: 2.50,
    environmentalImpact: {
      co2Reduced: 2.5,
      waterSaved: 100,
      treesSaved: 0.1,
      energySaved: 5
    },
    description: 'Clear plastic bottles (PET) used for beverages and water',
    image: 'pet-bottles.jpg'
  },
  {
    name: 'Mixed Paper',
    category: 'paper',
    pricePerKg: 1.20,
    environmentalImpact: {
      co2Reduced: 1.8,
      waterSaved: 150,
      treesSaved: 0.2,
      energySaved: 4
    },
    description: 'Mixed paper including newspapers, magazines, and office paper',
    image: 'mixed-paper.jpg'
  },
  {
    name: 'Clear Glass',
    category: 'glass',
    pricePerKg: 0.80,
    environmentalImpact: {
      co2Reduced: 0.5,
      waterSaved: 50,
      treesSaved: 0.05,
      energySaved: 2
    },
    description: 'Clear glass bottles and containers',
    image: 'clear-glass.jpg'
  },
  {
    name: 'Aluminum Cans',
    category: 'metal',
    pricePerKg: 3.00,
    environmentalImpact: {
      co2Reduced: 3.0,
      waterSaved: 200,
      treesSaved: 0.15,
      energySaved: 8
    },
    description: 'Aluminum beverage cans',
    image: 'aluminum-cans.jpg'
  },
  {
    name: 'Cardboard',
    category: 'paper',
    pricePerKg: 1.00,
    environmentalImpact: {
      co2Reduced: 1.5,
      waterSaved: 120,
      treesSaved: 0.18,
      energySaved: 3
    },
    description: 'Corrugated cardboard boxes and packaging',
    image: 'cardboard.jpg'
  },
  {
    name: 'Mixed Plastics',
    category: 'plastic',
    pricePerKg: 1.50,
    environmentalImpact: {
      co2Reduced: 2.0,
      waterSaved: 80,
      treesSaved: 0.08,
      energySaved: 4
    },
    description: 'Mixed plastic containers and packaging',
    image: 'mixed-plastics.jpg'
  },
  {
    name: 'Food Waste',
    category: 'organic',
    pricePerKg: 0.50,
    environmentalImpact: {
      co2Reduced: 1.0,
      waterSaved: 30,
      treesSaved: 0.05,
      energySaved: 1
    },
    description: 'Food scraps and organic waste',
    image: 'food-waste.jpg'
  }
];

const seedMaterials = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:admin@localhost:27017/recycleconnect?authSource=admin&directConnection=true');
    
    // Clear existing materials
    await Material.deleteMany({});
    
    // Insert new materials
    await Material.insertMany(materials);
    
    console.log('Materials seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding materials:', error);
    process.exit(1);
  }
};

seedMaterials(); 