const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'trophy'
  },
  category: {
    type: String,
    required: true,
    enum: ['habits', 'streak', 'level', 'social', 'challenges', 'groups', 'other']
  },
  xpReward: {
    type: Number,
    required: true
  },
  requirements: {
    habitCount: {
      type: Number
    },
    streakDays: {
      type: Number
    },
    level: {
      type: Number
    },
    friendCount: {
      type: Number
    },
    challengeCount: {
      type: Number
    },
    groupCount: {
      type: Number
    },
    custom: {
      type: String
    }
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', AchievementSchema); 