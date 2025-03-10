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
    const { title, description, category, frequency, customDays, difficulty, isPublic } = req.body;
    
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
      coinsReward,
      isPublic: isPublic || false
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

// Get public habits for workshop
exports.getPublicHabits = async (req, res) => {
  try {
    const { sort = 'newest', category, search } = req.query;
    
    const query = { isPublic: true };
    
    // Apply category filter if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Apply search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = { createdAt: -1 }; // Default sort by newest
    
    // Apply sort options
    if (sort === 'rating') {
      sortOption = { avgRating: -1 };
    } else if (sort === 'popularity') {
      sortOption = { downloads: -1 };
    }
    
    const habits = await Habit.find(query)
      .select('title description category difficulty avgRating totalRatings downloads createdAt user')
      .populate('user', 'username')
      .sort(sortOption);
    
    res.json({ success: true, habits });
  } catch (error) {
    console.error('Get public habits error:', error);
    res.status(500).json({ message: 'Server error fetching public habits' });
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
      r => r.user.toString() === req.user.userId
    );
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      habit.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      habit.ratings.push({
        user: req.user.userId,
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
    const user = await User.findById(req.user.userId);
    
    // Add comment
    habit.comments.push({
      user: req.user.userId,
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
    if (habit.user.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot import your own habit' });
    }
    
    // Create a new habit for the user based on the public one
    const newHabit = new Habit({
      user: req.user.userId,
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