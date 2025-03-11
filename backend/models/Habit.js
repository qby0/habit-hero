const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['health', 'productivity', 'social', 'education', 'finance', 'personal', 'other']
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'custom']
  },
  customDays: {
    type: [String],
    default: [],
    validate: {
      validator: function(days) {
        if (this.frequency !== 'custom') return true;
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.length > 0 && days.every(day => validDays.includes(day));
      },
      message: 'Custom days must include at least one valid day of the week'
    }
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  isNegative: {
    type: Boolean,
    default: false
  },
  abstainDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    validate: {
      validator: function(value) {
        return !this.isNegative || (this.isNegative && value);
      },
      message: 'Abstain difficulty is required for negative habits'
    }
  },
  triggers: {
    type: [String],
    default: [],
    validate: {
      validator: function(triggers) {
        return !this.isNegative || (this.isNegative && triggers.length > 0);
      },
      message: 'At least one trigger is required for negative habits'
    }
  },
  streak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  abstainDays: {
    type: Number,
    default: 0
  },
  maxAbstainDays: {
    type: Number,
    default: 0
  },
  completionHistory: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      completed: {
        type: Boolean,
        default: false
      }
    }
  ],
  isPublic: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      text: {
        type: String,
        required: true
      },
      username: {
        type: String
      },
      avatar: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска привычек пользователя
HabitSchema.index({ user: 1, createdAt: -1 });

// Индекс для поиска публичных привычек
HabitSchema.index({ isPublic: 1, likes: -1 });

module.exports = mongoose.model('Habit', HabitSchema); 