const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['plastic', 'paper', 'glass', 'metal', 'electronics', 'organic'],
    required: true
  },
  pricePerKg: {
    type: Number,
    required: true
  },
  environmentalImpact: {
    co2Reduced: {
      type: Number,  // kg of CO2 reduced per kg of material
      required: true
    },
    waterSaved: {
      type: Number,  // liters of water saved per kg of material
      required: true
    },
    treesSaved: {
      type: Number,  // equivalent trees saved per kg of material
      required: true
    },
    energySaved: {
      type: Number,  // kWh of energy saved per kg of material
      required: true
    }
  },
  description: String,
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  marketFactors: {
    seasonalAdjustments: {
      type: Map,
      of: Number,
      default: new Map([
        ['0', 1.2],   // January
        ['1', 1.1],   // February
        ['2', 1.0],   // March
        ['3', 0.9],   // April
        ['4', 0.8],   // May
        ['5', 0.9],   // June
        ['6', 1.0],   // July
        ['7', 1.1],   // August
        ['8', 1.2],   // September
        ['9', 1.3],   // October
        ['10', 1.2],  // November
        ['11', 1.1]   // December
      ])
    },
    supplySensitivity: {
      type: Number,
      default: 1.0,  // How sensitive price is to supply changes
      min: 0,
      max: 2
    },
    demandSensitivity: {
      type: Number,
      default: 1.0,  // How sensitive price is to demand changes
      min: 0,
      max: 2
    }
  }
});

module.exports = mongoose.model('Material', materialSchema);