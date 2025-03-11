const Habit = require('../models/Habit');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const mongoose = require('mongoose');

// Get all habits for a user
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.status(200).json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single habit by ID
exports.getHabitById = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new habit
exports.createHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, customDays, difficulty, isNegative, triggers, abstainDifficulty } = req.body;
    
    // Set experience and coins based on difficulty
    let experiencePoints = 10;
    let coinsReward = 5;
    
    if (difficulty === 'easy') {
      experiencePoints = 5;
      coinsReward = 3;
    } else if (difficulty === 'hard') {
      experiencePoints = 15;
      coinsReward = 8;
    }
    
    const newHabit = new Habit({
      user: req.user.id,
      title,
      description,
      category,
      frequency,
      customDays: frequency === 'custom' ? customDays : [],
      difficulty,
      experiencePoints,
      coinsReward,
      isNegative: isNegative || false,
      abstainDifficulty: abstainDifficulty || 5,
      triggers: triggers || []
    });
    
    await newHabit.save();
    
    // Check for "habit creator" achievement
    const habitCount = await Habit.countDocuments({ user: req.user.id });
    const achievements = await Achievement.find({ type: 'habits' });
    
    for (let achievement of achievements) {
      if (habitCount >= achievement.threshold) {
        // Check if user already has this achievement
        const user = await User.findById(req.user.id);
        if (!user.achievements.includes(achievement._id)) {
          // Add achievement to user
          user.achievements.push(achievement._id);
          user.experience += achievement.experienceReward;
          user.coins += achievement.coinsReward;
          
          // Check for level up
          const levelThreshold = 100 * user.level;
          if (user.experience >= levelThreshold) {
            user.level += 1;
          }
          
          await user.save();
        }
      }
    }
    
    res.status(201).json(newHabit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a habit
exports.updateHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, customDays, difficulty, archived, isNegative, triggers, abstainDifficulty } = req.body;
    
    let habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    habit.title = title || habit.title;
    habit.description = description !== undefined ? description : habit.description;
    habit.category = category || habit.category;
    habit.frequency = frequency || habit.frequency;
    habit.customDays = customDays || habit.customDays;
    habit.difficulty = difficulty || habit.difficulty;
    habit.archived = archived !== undefined ? archived : habit.archived;
    
    if (isNegative !== undefined) {
      habit.isNegative = isNegative;
    }
    
    if (triggers) {
      habit.triggers = triggers;
    }
    
    if (abstainDifficulty) {
      habit.abstainDifficulty = abstainDifficulty;
    }
    
    await habit.save();
    
    res.status(200).json(habit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a habit
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    await habit.remove();
    
    res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete a habit
exports.completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    if (habit.isNegative) {
      return res.status(400).json({ message: 'Cannot complete a negative habit', code: 'negativeHabit' });
    }
    
    const result = await habit.markCompleted();
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    const user = await User.findById(req.user.id);
    const rewardXP = result.baseReward + result.comboBonus;
    const rewardCoins = Math.round(result.baseReward / 2);
    
    user.xp += rewardXP;
    user.coins += rewardCoins;
    
    const oldLevel = user.level;
    const xpForNextLevel = (user.level * 100) + 50;
    
    if (user.xp >= xpForNextLevel) {
      user.level += 1;
      user.xp = user.xp - xpForNextLevel;
    }
    
    await user.save();
    
    const response = {
      success: true,
      streak: result.streak,
      comboCount: result.comboCount,
      rewards: {
        xp: rewardXP,
        coins: rewardCoins
      },
      levelUp: user.level > oldLevel,
      newLevel: user.level > oldLevel ? user.level : null
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get public habits for workshop
exports.getPublicHabits = async (req, res) => {
  try {
    const { category, sort, search, page = 1, limit = 10 } = req.query;
    
    const filter = { public: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortField = {};
    switch(sort) {
      case 'newest':
        sortField = { createdAt: -1 };
        break;
      case 'highestRated':
        sortField = { 'averageRating': -1 };
        break;
      case 'mostDownloaded':
        sortField = { downloads: -1 };
        break;
      default:
        sortField = { createdAt: -1 };
    }
    
    const total = await Habit.countDocuments(filter);
    
    const skip = (page - 1) * limit;
    
    const habits = await Habit.find(filter)
      .populate('user', 'username')
      .sort(sortField)
      .skip(skip)
      .limit(Number(limit));
    
    const habitsWithRating = habits.map(habit => {
      const totalRating = habit.ratings.reduce((acc, rating) => acc + rating.value, 0);
      const averageRating = habit.ratings.length > 0 ? totalRating / habit.ratings.length : 0;
      
      return {
        ...habit.toObject(),
        averageRating,
        ratingCount: habit.ratings.length
      };
    });
    
    res.status(200).json({
      habits: habitsWithRating,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single public habit
exports.getPublicHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, isPublic: true })
      .populate('user', 'username')
      .populate('comments.user', 'username');
    
    if (!habit) {
      return res.status(404).json({ message: 'Public habit not found' });
    }
    
    res.json({ success: true, habit });
  } catch (error) {
    console.error('Get public habit error:', error);
    res.status(500).json({ message: 'Server error fetching public habit' });
  }
};

// Rate a public habit
exports.rateHabit = async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const habit = await Habit.findById(req.params.id);
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    if (!habit.isPublic) {
      return res.status(400).json({ message: 'Cannot rate a private habit' });
    }
    
    // Check if user already rated this habit
    const existingRatingIndex = habit.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      habit.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      habit.ratings.push({
        user: req.user.id,
        rating
      });
    }
    
    // Recalculate average rating
    const totalRatingPoints = habit.ratings.reduce((sum, r) => sum + r.rating, 0);
    habit.avgRating = totalRatingPoints / habit.ratings.length;
    habit.totalRatings = habit.ratings.length;
    
    await habit.save();
    
    res.json({ 
      success: true, 
      avgRating: habit.avgRating, 
      totalRatings: habit.totalRatings 
    });
  } catch (error) {
    console.error('Rate habit error:', error);
    res.status(500).json({ message: 'Server error rating habit' });
  }
};

// Comment on a public habit
exports.commentHabit = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const habit = await Habit.findById(req.params.id);
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    if (!habit.isPublic) {
      return res.status(400).json({ message: 'Cannot comment on a private habit' });
    }
    
    // Get user info
    const user = await User.findById(req.user.id);
    
    // Add comment
    habit.comments.push({
      user: req.user.id,
      username: user.username,
      text
    });
    
    await habit.save();
    
    res.json({ 
      success: true, 
      comment: habit.comments[habit.comments.length - 1]
    });
  } catch (error) {
    console.error('Comment habit error:', error);
    res.status(500).json({ message: 'Server error commenting on habit' });
  }
};

// Import a public habit to user's habits
exports.importHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, isPublic: true });
    
    if (!habit) {
      return res.status(404).json({ message: 'Public habit not found' });
    }
    
    // Check if user is trying to import their own habit
    if (habit.user.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot import your own habit' });
    }
    
    // Check if user has already imported this habit
    const existingImport = await Habit.findOne({
      user: req.user.id,
      title: habit.title,
      category: habit.category,
      difficulty: habit.difficulty
    });
    
    if (existingImport) {
      return res.status(400).json({ 
        message: 'You have already imported this habit',
        alreadyImported: true 
      });
    }
    
    // Create a new habit for the user based on the public one
    const newHabit = new Habit({
      user: req.user.id,
      title: habit.title,
      description: habit.description,
      category: habit.category,
      frequency: habit.frequency,
      customDays: habit.customDays,
      difficulty: habit.difficulty,
      experiencePoints: habit.experiencePoints,
      coinsReward: habit.coinsReward,
      isPublic: false // New imported habit is private by default
    });
    
    await newHabit.save();
    
    // Increment download count on original habit
    habit.downloads += 1;
    await habit.save();
    
    res.json({ success: true, habit: newHabit });
  } catch (error) {
    console.error('Import habit error:', error);
    res.status(500).json({ message: 'Server error importing habit' });
  }
};

// Mark abstained from a negative habit
exports.markAbstained = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    if (!habit.isNegative) {
      return res.status(400).json({ message: 'This is not a negative habit', code: 'notNegativeHabit' });
    }
    
    const result = await habit.markAbstained();
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    const user = await User.findById(req.user.id);
    const rewardXP = result.baseReward + result.streakBonus;
    const rewardCoins = Math.round(result.baseReward / 2);
    
    user.xp += rewardXP;
    user.coins += rewardCoins;
    
    const oldLevel = user.level;
    const xpForNextLevel = (user.level * 100) + 50;
    
    if (user.xp >= xpForNextLevel) {
      user.level += 1;
      user.xp = user.xp - xpForNextLevel;
    }
    
    await user.save();
    
    const response = {
      success: true,
      abstainDays: result.abstainDays,
      maxAbstainDays: result.maxAbstainDays,
      rewards: {
        xp: rewardXP,
        coins: rewardCoins
      },
      levelUp: user.level > oldLevel,
      newLevel: user.level > oldLevel ? user.level : null
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark failed from a negative habit
exports.markFailed = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    if (!habit.isNegative) {
      return res.status(400).json({ message: 'This is not a negative habit', code: 'notNegativeHabit' });
    }
    
    const result = await habit.markFailed();
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    const response = {
      success: true,
      message: 'Habit marked as failed. Don\'t worry, it\'s part of the journey. Tomorrow is a new day!',
      abstainDays: 0
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get habit stats for a user
exports.getHabitStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const habits = await Habit.find({ user: userId });
    
    const positiveHabits = habits.filter(h => !h.isNegative);
    const totalPositive = positiveHabits.length;
    const totalCompleted = positiveHabits.reduce((acc, habit) => 
      acc + habit.completionHistory.filter(c => c.completed).length, 0);
    const maxStreak = positiveHabits.reduce((max, habit) => 
      habit.streak > max ? habit.streak : max, 0);
    
    const negativeHabits = habits.filter(h => h.isNegative);
    const totalNegative = negativeHabits.length;
    const maxAbstainDays = negativeHabits.reduce((max, habit) => 
      habit.maxAbstainDays > max ? habit.maxAbstainDays : max, 0);
    const currentAbstainDays = negativeHabits.reduce((sum, habit) => 
      sum + habit.abstainDays, 0);
    
    const categoryCounts = {};
    habits.forEach(habit => {
      if (!categoryCounts[habit.category]) {
        categoryCounts[habit.category] = 0;
      }
      categoryCounts[habit.category] += 1;
    });
    
    const stats = {
      totalHabits: habits.length,
      positiveHabits: {
        total: totalPositive,
        completed: totalCompleted,
        maxStreak
      },
      negativeHabits: {
        total: totalNegative,
        maxAbstainDays,
        currentAbstainDays
      },
      categoryCounts,
      activeHabits: habits.filter(h => !h.archived).length,
      archivedHabits: habits.filter(h => h.archived).length
    };
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports; 