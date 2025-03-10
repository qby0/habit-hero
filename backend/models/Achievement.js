const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'trophy'
  },
  type: {
    type: String,
    enum: ['streak', 'completions', 'level', 'habits'],
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  experienceReward: {
    type: Number,
    default: 50
  },
  coinsReward: {
    type: Number,
    default: 20
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', AchievementSchema); 