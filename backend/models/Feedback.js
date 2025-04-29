const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['survey', 'feedback', 'complaint', 'suggestion'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['service', 'app', 'pickup', 'recycling', 'other'],
    required: true
  },
  userBehavior: {
    recyclingFrequency: String,
    preferredPickupTimes: [String],
    recyclingTypes: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema); 