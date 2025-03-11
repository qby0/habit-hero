const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Group = require('../models/Group');

// @route   GET api/leaderboard/global
// @desc    Get global leaderboard
// @access  Private
router.get('/global', auth, async (req, res) => {
  try {
    // Get top users by level and XP
    const users = await User.find()
      .select('username avatar level xp streak longestStreak totalCompletedHabits')
      .sort({ level: -1, xp: -1 })
      .limit(100);
    
    // Find current user's position
    const userPosition = await User.countDocuments({
      $or: [
        { level: { $gt: req.user.level } },
        {
          level: req.user.level,
          xp: { $gt: req.user.xp }
        }
      ]
    });
    
    res.json({
      leaderboard: users,
      userPosition: userPosition + 1 // Add 1 because position is 0-indexed
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/leaderboard/weekly
// @desc    Get weekly leaderboard
// @access  Private
router.get('/weekly', auth, async (req, res) => {
  try {
    // Get start of current week (Monday)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get users who have been active this week
    const users = await User.find({
      lastActive: { $gte: startOfWeek }
    })
      .select('username avatar level xp streak longestStreak totalCompletedHabits')
      .sort({ totalCompletedHabits: -1, level: -1 })
      .limit(100);
    
    // Find current user's position
    const currentUser = await User.findById(req.user.id);
    const userPosition = await User.countDocuments({
      lastActive: { $gte: startOfWeek },
      $or: [
        { totalCompletedHabits: { $gt: currentUser.totalCompletedHabits } },
        {
          totalCompletedHabits: currentUser.totalCompletedHabits,
          level: { $gt: currentUser.level }
        }
      ]
    });
    
    res.json({
      leaderboard: users,
      userPosition: userPosition + 1 // Add 1 because position is 0-indexed
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/leaderboard/friends
// @desc    Get friends leaderboard
// @access  Private
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get friends with user details
    const friends = await User.find({
      _id: { $in: [...user.friends, req.user.id] } // Include current user
    })
      .select('username avatar level xp streak longestStreak totalCompletedHabits')
      .sort({ level: -1, xp: -1 });
    
    res.json(friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/leaderboard/group/:id
// @desc    Get group leaderboard
// @access  Private
router.get('/group/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Check if user is a member or admin if group is private
    if (group.isPrivate) {
      const isMember = group.members.includes(req.user.id);
      const isAdmin = group.admin.toString() === req.user.id;
      
      if (!isMember && !isAdmin) {
        return res.status(401).json({ msg: 'Not authorized to view this group' });
      }
    }
    
    // Get members with user details
    const members = await User.find({
      _id: { $in: group.members }
    })
      .select('username avatar level xp streak longestStreak totalCompletedHabits')
      .sort({ level: -1, xp: -1 });
    
    res.json(members);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/leaderboard/streak
// @desc    Get streak leaderboard
// @access  Private
router.get('/streak', auth, async (req, res) => {
  try {
    // Get top users by streak
    const users = await User.find()
      .select('username avatar level xp streak longestStreak totalCompletedHabits')
      .sort({ streak: -1, longestStreak: -1 })
      .limit(100);
    
    // Find current user's position
    const userPosition = await User.countDocuments({
      $or: [
        { streak: { $gt: req.user.streak } },
        {
          streak: req.user.streak,
          longestStreak: { $gt: req.user.longestStreak }
        }
      ]
    });
    
    res.json({
      leaderboard: users,
      userPosition: userPosition + 1 // Add 1 because position is 0-indexed
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 