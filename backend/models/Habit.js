const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['health', 'productivity', 'relationships', 'learning', 'other'],
    default: 'other'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  customDays: {
    type: [String],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  experiencePoints: {
    type: Number,
    default: 10
  },
  coinsReward: {
    type: Number,
    default: 5
  },
  streak: {
    type: Number,
    default: 0
  },
  completions: [{
    date: {
      type: Date,
      default: Date.now
    },
    completed: {
      type: Boolean,
      default: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Method to check if habit is completed for today
HabitSchema.methods.isCompletedToday = function() {
  if (this.completions.length === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastCompletion = this.completions[this.completions.length - 1];
  const lastCompletionDate = new Date(lastCompletion.date);
  lastCompletionDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === lastCompletionDate.getTime() && lastCompletion.completed;
};

// Method to calculate streak
HabitSchema.methods.calculateStreak = function() {
  if (this.completions.length === 0) return 0;
  
  let streak = 0;
  const completions = [...this.completions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Check last completion
  const lastCompletion = completions[completions.length - 1];
  const lastCompletionDate = new Date(lastCompletion.date);
  lastCompletionDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // If last completion is not today or yesterday, streak is broken
  if (lastCompletionDate.getTime() !== today.getTime() && 
      lastCompletionDate.getTime() !== yesterday.getTime()) {
    return 0;
  }
  
  // Count the streak
  const days = {};
  completions.forEach(completion => {
    if (completion.completed) {
      const date = new Date(completion.date);
      date.setHours(0, 0, 0, 0);
      days[date.getTime()] = true;
    }
  });
  
  let currentDate = new Date(lastCompletionDate);
  
  while (days[currentDate.getTime()]) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};

module.exports = mongoose.model('Habit', HabitSchema); 