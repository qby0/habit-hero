const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'special']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  xpReward: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // Duration in days
    default: 1
  },
  participants: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  requirements: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска ежедневных задач
ChallengeSchema.index({ type: 1, date: 1 });

module.exports = mongoose.model('Challenge', ChallengeSchema); 