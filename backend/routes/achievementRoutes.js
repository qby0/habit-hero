const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

// @route   GET api/achievements
// @desc    Get all achievements
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ order: 1 });
    res.json(achievements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/achievements/user
// @desc    Get user's achievements
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('unlockedAchievements');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get all achievements
    const allAchievements = await Achievement.find().sort({ order: 1 });
    
    // Map achievements to include unlocked status
    const achievements = allAchievements.map(achievement => {
      const isUnlocked = user.unlockedAchievements.some(
        a => a._id.toString() === achievement._id.toString()
      );
      
      return {
        ...achievement._doc,
        isUnlocked
      };
    });
    
    res.json(achievements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/achievements/:id/unlock
// @desc    Unlock an achievement
// @access  Private
router.post('/:id/unlock', auth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if achievement is already unlocked
    if (user.unlockedAchievements.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Achievement already unlocked' });
    }
    
    // Add achievement to user's unlocked achievements
    user.unlockedAchievements.push(req.params.id);
    
    // Add XP reward
    user.xp += achievement.xpReward;
    
    // Check if user leveled up
    const xpNeededForNextLevel = user.level * 100;
    let leveledUp = false;
    
    if (user.xp >= xpNeededForNextLevel) {
      user.level += 1;
      leveledUp = true;
    }
    
    await user.save();
    
    res.json({
      msg: 'Achievement unlocked',
      achievement,
      user: {
        id: user._id,
        xp: user.xp,
        level: user.level
      },
      xpGained: achievement.xpReward,
      leveledUp
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Admin routes for achievement management

// @route   POST api/achievements
// @desc    Create a new achievement (admin only)
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const {
      title,
      description,
      icon,
      category,
      xpReward,
      requirements,
      order
    } = req.body;
    
    const newAchievement = new Achievement({
      title,
      description,
      icon,
      category,
      xpReward,
      requirements,
      order
    });
    
    const achievement = await newAchievement.save();
    
    res.json(achievement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/achievements/:id
// @desc    Update an achievement (admin only)
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    
    const {
      title,
      description,
      icon,
      category,
      xpReward,
      requirements,
      order
    } = req.body;
    
    // Update fields
    if (title) achievement.title = title;
    if (description) achievement.description = description;
    if (icon) achievement.icon = icon;
    if (category) achievement.category = category;
    if (xpReward) achievement.xpReward = xpReward;
    if (requirements) achievement.requirements = requirements;
    if (order) achievement.order = order;
    
    await achievement.save();
    
    res.json(achievement);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/achievements/:id
// @desc    Delete an achievement (admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const achievement = await Achievement.findById(req.params.id);
    
    if (!achievement) {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    
    // Remove achievement from all users
    await User.updateMany(
      { unlockedAchievements: req.params.id },
      { $pull: { unlockedAchievements: req.params.id } }
    );
    
    await achievement.remove();
    
    res.json({ msg: 'Achievement removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Achievement not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/achievements/check
// @desc    Check and award achievements
// @access  Private
router.post('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('unlockedAchievements');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get all achievements
    const allAchievements = await Achievement.find();
    
    // Filter out already unlocked achievements
    const unlockedIds = user.unlockedAchievements.map(a => a._id.toString());
    const lockedAchievements = allAchievements.filter(
      a => !unlockedIds.includes(a._id.toString())
    );
    
    // Check each achievement
    const newlyUnlocked = [];
    let totalXpGained = 0;
    
    for (const achievement of lockedAchievements) {
      let unlocked = false;
      
      // Check requirements based on category
      switch (achievement.category) {
        case 'habits':
          // Check habit count
          if (achievement.requirements.habitCount && user.totalCompletedHabits >= achievement.requirements.habitCount) {
            unlocked = true;
          }
          break;
          
        case 'streak':
          // Check streak length
          if (achievement.requirements.streakDays && user.longestStreak >= achievement.requirements.streakDays) {
            unlocked = true;
          }
          break;
          
        case 'level':
          // Check user level
          if (achievement.requirements.level && user.level >= achievement.requirements.level) {
            unlocked = true;
          }
          break;
          
        case 'social':
          // Check friend count
          if (achievement.requirements.friendCount && user.friends.length >= achievement.requirements.friendCount) {
            unlocked = true;
          }
          break;
          
        case 'challenges':
          // Check completed challenges count
          if (achievement.requirements.challengeCount && user.completedChallenges.length >= achievement.requirements.challengeCount) {
            unlocked = true;
          }
          break;
          
        case 'groups':
          // Check group count
          if (achievement.requirements.groupCount && user.groups.length >= achievement.requirements.groupCount) {
            unlocked = true;
          }
          break;
      }
      
      if (unlocked) {
        // Add achievement to user's unlocked achievements
        user.unlockedAchievements.push(achievement._id);
        
        // Add XP reward
        user.xp += achievement.xpReward;
        totalXpGained += achievement.xpReward;
        
        newlyUnlocked.push(achievement);
      }
    }
    
    // Check if user leveled up
    const xpNeededForNextLevel = user.level * 100;
    let leveledUp = false;
    
    if (user.xp >= xpNeededForNextLevel) {
      user.level += 1;
      leveledUp = true;
    }
    
    if (newlyUnlocked.length > 0) {
      await user.save();
    }
    
    res.json({
      unlockedAchievements: newlyUnlocked,
      xpGained: totalXpGained,
      leveledUp,
      user: {
        id: user._id,
        xp: user.xp,
        level: user.level
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 