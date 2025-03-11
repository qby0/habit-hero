const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');
const User = require('../models/User');

// Защищаем все маршруты с помощью auth middleware
router.use(auth);

// @route   GET api/habits
// @desc    Get all habits for a user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/habits
// @desc    Create a habit
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      frequency,
      customDays,
      difficulty,
      isNegative,
      abstainDifficulty,
      triggers
    } = req.body;

    const newHabit = new Habit({
      title,
      description,
      category,
      frequency,
      customDays,
      difficulty,
      isNegative,
      abstainDifficulty,
      triggers,
      user: req.user.id
    });

    const habit = await newHabit.save();
    res.json(habit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/habits/:id
// @desc    Get habit by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    res.json(habit);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Habit not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/habits/:id
// @desc    Update a habit
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const {
      title,
      description,
      category,
      frequency,
      customDays,
      difficulty,
      isNegative,
      abstainDifficulty,
      triggers
    } = req.body;

    // Update fields
    if (title) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (category) habit.category = category;
    if (frequency) habit.frequency = frequency;
    if (customDays) habit.customDays = customDays;
    if (difficulty) habit.difficulty = difficulty;
    if (isNegative !== undefined) habit.isNegative = isNegative;
    if (abstainDifficulty) habit.abstainDifficulty = abstainDifficulty;
    if (triggers) habit.triggers = triggers;

    await habit.save();
    res.json(habit);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Habit not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await habit.remove();
    res.json({ msg: 'Habit removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Habit not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/habits/:id/complete
// @desc    Complete a habit
// @access  Private
router.post('/:id/complete', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Check if habit is already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompletion = habit.completionHistory.length > 0
      ? habit.completionHistory[habit.completionHistory.length - 1]
      : null;

    if (lastCompletion) {
      const lastCompletionDate = new Date(lastCompletion.date);
      lastCompletionDate.setHours(0, 0, 0, 0);

      if (lastCompletionDate.getTime() === today.getTime()) {
        return res.status(400).json({ msg: 'Habit already completed today' });
      }
    }

    // Add completion to history
    habit.completionHistory.push({
      date: Date.now(),
      completed: true
    });

    // Update streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streakBroken = true;

    if (lastCompletion) {
      const lastCompletionDate = new Date(lastCompletion.date);
      lastCompletionDate.setHours(0, 0, 0, 0);

      // Check if last completion was yesterday or today
      if (
        lastCompletionDate.getTime() === yesterday.getTime() ||
        lastCompletionDate.getTime() === today.getTime()
      ) {
        streakBroken = false;
      }
    }

    if (streakBroken) {
      habit.streak = 1;
    } else {
      habit.streak += 1;
    }

    // Update longest streak if needed
    if (habit.streak > habit.longestStreak) {
      habit.longestStreak = habit.streak;
    }

    // Update user stats
    const user = await User.findById(req.user.id);
    
    // Add XP based on difficulty
    let xpGained = 0;
    switch (habit.difficulty) {
      case 'easy':
        xpGained = 10;
        break;
      case 'medium':
        xpGained = 20;
        break;
      case 'hard':
        xpGained = 30;
        break;
      default:
        xpGained = 10;
    }
    
    user.xp += xpGained;
    user.totalCompletedHabits += 1;
    
    // Check if user leveled up
    const xpNeededForNextLevel = user.level * 100;
    let leveledUp = false;
    
    if (user.xp >= xpNeededForNextLevel) {
      user.level += 1;
      leveledUp = true;
    }
    
    // Update user streak if this is their highest streak
    if (habit.streak > user.streak) {
      user.streak = habit.streak;
    }
    
    // Update longest streak if needed
    if (user.streak > user.longestStreak) {
      user.longestStreak = user.streak;
    }
    
    // Update last active
    user.lastActive = Date.now();
    
    await user.save();
    await habit.save();
    
    res.json({
      habit,
      user: {
        id: user._id,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak,
        totalCompletedHabits: user.totalCompletedHabits
      },
      xpGained,
      leveledUp
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Habit not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/habits/:id/abstain
// @desc    Mark abstained from a negative habit
// @access  Private
router.post('/:id/abstain', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Check if habit is negative
    if (!habit.isNegative) {
      return res.status(400).json({ msg: 'This is not a negative habit' });
    }

    // Check if habit is already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastEntry = habit.completionHistory.length > 0
      ? habit.completionHistory[habit.completionHistory.length - 1]
      : null;

    if (lastEntry) {
      const lastEntryDate = new Date(lastEntry.date);
      lastEntryDate.setHours(0, 0, 0, 0);

      if (lastEntryDate.getTime() === today.getTime()) {
        return res.status(400).json({ msg: 'Habit already marked today' });
      }
    }

    // Add abstain entry to history (completed: false means abstained for negative habits)
    habit.completionHistory.push({
      date: Date.now(),
      completed: false
    });

    // Update abstain days
    habit.abstainDays += 1;

    // Update streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streakBroken = true;

    if (lastEntry) {
      const lastEntryDate = new Date(lastEntry.date);
      lastEntryDate.setHours(0, 0, 0, 0);

      // Check if last entry was yesterday or today and was an abstain
      if (
        (lastEntryDate.getTime() === yesterday.getTime() || lastEntryDate.getTime() === today.getTime()) &&
        !lastEntry.completed
      ) {
        streakBroken = false;
      }
    }

    if (streakBroken) {
      habit.streak = 1;
    } else {
      habit.streak += 1;
    }

    // Update max abstain days if needed
    if (habit.abstainDays > habit.maxAbstainDays) {
      habit.maxAbstainDays = habit.abstainDays;
    }

    // Update longest streak if needed
    if (habit.streak > habit.longestStreak) {
      habit.longestStreak = habit.streak;
    }

    // Update user stats
    const user = await User.findById(req.user.id);
    
    // Add XP based on abstain difficulty
    let xpGained = 0;
    switch (habit.abstainDifficulty) {
      case 'easy':
        xpGained = 10;
        break;
      case 'medium':
        xpGained = 20;
        break;
      case 'hard':
        xpGained = 30;
        break;
      default:
        xpGained = 10;
    }
    
    user.xp += xpGained;
    
    // Check if user leveled up
    const xpNeededForNextLevel = user.level * 100;
    let leveledUp = false;
    
    if (user.xp >= xpNeededForNextLevel) {
      user.level += 1;
      leveledUp = true;
    }
    
    // Update user streak if this is their highest streak
    if (habit.streak > user.streak) {
      user.streak = habit.streak;
    }
    
    // Update longest streak if needed
    if (user.streak > user.longestStreak) {
      user.longestStreak = user.streak;
    }
    
    // Update last active
    user.lastActive = Date.now();
    
    await user.save();
    await habit.save();
    
    res.json({
      habit,
      user: {
        id: user._id,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        longestStreak: user.longestStreak
      },
      xpGained,
      leveledUp
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Habit not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/habits/:id/fail
// @desc    Mark failed for a negative habit
// @access  Private
router.post('/:id/fail', async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Check if habit is negative
    if (!habit.isNegative) {
      return res.status(400).json({ msg: 'This is not a negative habit' });
    }

    // Check if habit is already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastEntry = habit.completionHistory.length > 0
      ? habit.completionHistory[habit.completionHistory.length - 1]
      : null;

    if (lastEntry) {
      const lastEntryDate = new Date(lastEntry.date);
      lastEntryDate.setHours(0, 0, 0, 0);

      if (lastEntryDate.getTime() === today.getTime()) {
        return res.status(400).json({ msg: 'Habit already marked today' });
      }
    }

    // Add fail entry to history (completed: true means failed for negative habits)
    habit.completionHistory.push({
      date: Date.now(),
      completed: true
    });

    // Reset abstain days and streak
    habit.abstainDays = 0;
    habit.streak = 0;

    // Update user stats
    const user = await User.findById(req.user.id);
    
    // Update last active
    user.lastActive = Date.now();
    
    await user.save();
    await habit.save();
    
    res.json({
      habit,
      user: {
        id: user._id,
        streak: user.streak,
        longestStreak: user.longestStreak
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Habit not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 