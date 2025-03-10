const Habit = require('../models/Habit');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

// Get all habits for a user
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.userId }).sort({ createdAt: -1 });
    
    // Update habit streaks before sending response
    for (let habit of habits) {
      const calculatedStreak = habit.calculateStreak();
      if (calculatedStreak !== habit.streak) {
        habit.streak = calculatedStreak;
        await habit.save();
      }
    }
    
    res.json({ success: true, habits });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Server error fetching habits' });
  }
};

// Create a new habit
exports.createHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, customDays, difficulty } = req.body;
    
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
      user: req.user.userId,
      title,
      description,
      category,
      frequency,
      customDays: frequency === 'custom' ? customDays : [],
      difficulty,
      experiencePoints,
      coinsReward
    });
    
    await newHabit.save();
    
    // Check for "habit creator" achievement
    const habitCount = await Habit.countDocuments({ user: req.user.userId });
    const achievements = await Achievement.find({ type: 'habits' });
    
    for (let achievement of achievements) {
      if (habitCount >= achievement.threshold) {
        // Check if user already has this achievement
        const user = await User.findById(req.user.userId);
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
    
    res.status(201).json({ success: true, habit: newHabit });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Server error creating habit' });
  }
};

// Get a single habit by ID
exports.getHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ 
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json({ success: true, habit });
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ message: 'Server error fetching habit' });
  }
};

// Update a habit
exports.updateHabit = async (req, res) => {
  try {
    const { title, description, category, frequency, customDays, difficulty, active } = req.body;
    
    const habit = await Habit.findOne({ 
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    if (title) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (category) habit.category = category;
    if (frequency) {
      habit.frequency = frequency;
      if (frequency === 'custom' && customDays) {
        habit.customDays = customDays;
      } else {
        habit.customDays = [];
      }
    }
    if (difficulty) {
      habit.difficulty = difficulty;
      
      // Update experience and coins based on difficulty
      if (difficulty === 'easy') {
        habit.experiencePoints = 5;
        habit.coinsReward = 3;
      } else if (difficulty === 'medium') {
        habit.experiencePoints = 10;
        habit.coinsReward = 5;
      } else if (difficulty === 'hard') {
        habit.experiencePoints = 15;
        habit.coinsReward = 8;
      }
    }
    if (active !== undefined) habit.active = active;
    
    await habit.save();
    
    res.json({ success: true, habit });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ message: 'Server error updating habit' });
  }
};

// Delete a habit
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Server error deleting habit' });
  }
};

// Complete a habit
exports.completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ 
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }
    
    // Check if already completed today
    if (habit.isCompletedToday()) {
      return res.status(400).json({ message: 'Habit already completed today' });
    }
    
    // Add completion
    habit.completions.push({ date: new Date(), completed: true });
    
    // Calculate new streak
    habit.streak = habit.calculateStreak();
    
    await habit.save();
    
    // Update user experience and coins
    const user = await User.findById(req.user.userId);
    user.experience += habit.experiencePoints;
    user.coins += habit.coinsReward;
    
    // Add streak bonus if streak >= 7
    if (habit.streak >= 7 && habit.streak % 7 === 0) {
      const streakBonus = 20;
      user.experience += streakBonus;
      user.coins += 10;
    }
    
    // Check for streak achievements
    const streakAchievements = await Achievement.find({ type: 'streak' });
    for (let achievement of streakAchievements) {
      if (habit.streak >= achievement.threshold) {
        // Check if user already has this achievement
        if (!user.achievements.includes(achievement._id)) {
          // Add achievement to user
          user.achievements.push(achievement._id);
          user.experience += achievement.experienceReward;
          user.coins += achievement.coinsReward;
        }
      }
    }
    
    // Check for level up
    const levelThreshold = 100 * user.level;
    let leveledUp = false;
    
    if (user.experience >= levelThreshold) {
      user.level += 1;
      leveledUp = true;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      habit,
      user: {
        experience: user.experience,
        coins: user.coins,
        level: user.level
      },
      leveledUp
    });
  } catch (error) {
    console.error('Complete habit error:', error);
    res.status(500).json({ message: 'Server error completing habit' });
  }
}; 