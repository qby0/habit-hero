const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Habit = require('../models/Habit');

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email, avatar, bio } = req.body;
    
    // Build user object
    const userFields = {};
    if (username) userFields.username = username;
    if (email) userFields.email = email;
    if (avatar) userFields.avatar = avatar;
    if (bio !== undefined) userFields.bio = bio;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/stats
// @desc    Get user stats
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get habits count
    const habitsCount = await Habit.countDocuments({ user: req.user.id });
    
    // Get completed habits count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = await Habit.countDocuments({
      user: req.user.id,
      'completionHistory.date': {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      'completionHistory.completed': true
    });
    
    // Get streak data
    const stats = {
      level: user.level,
      xp: user.xp,
      streak: user.streak,
      longestStreak: user.longestStreak,
      totalCompletedHabits: user.totalCompletedHabits,
      habitsCount,
      completedToday,
      xpToNextLevel: user.level * 100 - user.xp
    };
    
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/search
// @desc    Search users by username
// @access  Private
router.get('/search/:query', auth, async (req, res) => {
  try {
    const query = req.params.query;
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username avatar level');
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/friends
// @desc    Get user's friends
// @access  Private
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'username avatar level lastActive');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/friends/:id
// @desc    Add friend
// @access  Private
router.post('/friends/:id', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: 'Cannot add yourself as a friend' });
    }
    
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if already friends
    if (user.friends.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Already friends with this user' });
    }
    
    // Check if friend request already sent
    if (user.friendRequests.sent.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Friend request already sent' });
    }
    
    // Check if friend request already received
    if (user.friendRequests.received.includes(req.params.id)) {
      // Accept the friend request
      user.friendRequests.received = user.friendRequests.received.filter(
        id => id.toString() !== req.params.id
      );
      friend.friendRequests.sent = friend.friendRequests.sent.filter(
        id => id.toString() !== req.user.id
      );
      
      user.friends.push(req.params.id);
      friend.friends.push(req.user.id);
      
      await user.save();
      await friend.save();
      
      return res.json({ msg: 'Friend request accepted' });
    }
    
    // Send friend request
    user.friendRequests.sent.push(req.params.id);
    friend.friendRequests.received.push(req.user.id);
    
    await user.save();
    await friend.save();
    
    res.json({ msg: 'Friend request sent' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/friends/:id
// @desc    Remove friend
// @access  Private
router.delete('/friends/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if they are friends
    if (!user.friends.includes(req.params.id)) {
      return res.status(400).json({ msg: 'Not friends with this user' });
    }
    
    // Remove from friends
    user.friends = user.friends.filter(id => id.toString() !== req.params.id);
    friend.friends = friend.friends.filter(id => id.toString() !== req.user.id);
    
    await user.save();
    await friend.save();
    
    res.json({ msg: 'Friend removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/friend-requests
// @desc    Get friend requests
// @access  Private
router.get('/friend-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get received friend requests with user details
    const receivedRequests = await User.find({
      _id: { $in: user.friendRequests.received }
    }).select('username avatar level');
    
    // Get sent friend requests with user details
    const sentRequests = await User.find({
      _id: { $in: user.friendRequests.sent }
    }).select('username avatar level');
    
    res.json({
      received: receivedRequests,
      sent: sentRequests
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/friend-requests/:id/accept
// @desc    Accept friend request
// @access  Private
router.post('/friend-requests/:id/accept', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if friend request exists
    if (!user.friendRequests.received.includes(req.params.id)) {
      return res.status(400).json({ msg: 'No friend request from this user' });
    }
    
    // Remove from friend requests
    user.friendRequests.received = user.friendRequests.received.filter(
      id => id.toString() !== req.params.id
    );
    friend.friendRequests.sent = friend.friendRequests.sent.filter(
      id => id.toString() !== req.user.id
    );
    
    // Add to friends
    user.friends.push(req.params.id);
    friend.friends.push(req.user.id);
    
    await user.save();
    await friend.save();
    
    res.json({ msg: 'Friend request accepted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/friend-requests/:id/decline
// @desc    Decline friend request
// @access  Private
router.post('/friend-requests/:id/decline', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if friend request exists
    if (!user.friendRequests.received.includes(req.params.id)) {
      return res.status(400).json({ msg: 'No friend request from this user' });
    }
    
    // Remove from friend requests
    user.friendRequests.received = user.friendRequests.received.filter(
      id => id.toString() !== req.params.id
    );
    friend.friendRequests.sent = friend.friendRequests.sent.filter(
      id => id.toString() !== req.user.id
    );
    
    await user.save();
    await friend.save();
    
    res.json({ msg: 'Friend request declined' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/friend-requests/:id/cancel
// @desc    Cancel sent friend request
// @access  Private
router.post('/friend-requests/:id/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if friend request exists
    if (!user.friendRequests.sent.includes(req.params.id)) {
      return res.status(400).json({ msg: 'No friend request sent to this user' });
    }
    
    // Remove from friend requests
    user.friendRequests.sent = user.friendRequests.sent.filter(
      id => id.toString() !== req.params.id
    );
    friend.friendRequests.received = friend.friendRequests.received.filter(
      id => id.toString() !== req.user.id
    );
    
    await user.save();
    await friend.save();
    
    res.json({ msg: 'Friend request cancelled' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 