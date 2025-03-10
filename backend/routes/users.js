const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users/leaderboard
// @desc    Get top 10 users by level and experience
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await User.find()
      .select('username level experience streak coins achievements')
      .sort({ level: -1, experience: -1 })
      .limit(10);
    
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('achievements');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateFields = {};
    
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    
    // Check if username is taken if updating username
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    // Check if email is taken if updating email
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router; 