const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  recyclingVolume: {
    type: Number,
    default: 0
  },
  carbonCredits: {
    type: Number,
    default: 0
  },
  wasteReduction: {
    type: Number,
    default: 0
  },
  marketPrices: {
    plastic: Number,
    paper: Number,
    glass: Number,
    metal: Number
  },
  networkGrowth: {
    newUsers: Number,
    activeUsers: Number,
    totalPickups: Number
  },
  environmentalImpact: {
    co2Reduced: Number,
    treesSaved: Number,
    waterSaved: Number
  },
  economicBenefits: {
    totalValue: Number,
    userEarnings: Number,
    communityBenefits: Number
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema); 