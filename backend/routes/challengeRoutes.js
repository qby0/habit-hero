const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

// @route   GET api/challenges
// @desc    Get all challenges
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find().sort({ createdAt: -1 });
    res.json(challenges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/challenges/daily
// @desc    Get daily challenge
// @access  Private
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyChallenge = await Challenge.findOne({
      type: 'daily',
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (!dailyChallenge) {
      return res.status(404).json({ msg: 'No daily challenge found for today' });
    }
    
    res.json(dailyChallenge);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/challenges/user
// @desc    Get challenges for current user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get active challenges for user
    const activeChallenges = await Challenge.find({
      _id: { $in: user.activeChallenges }
    });
    
    // Get completed challenges for user
    const completedChallenges = await Challenge.find({
      _id: { $in: user.completedChallenges }
    });
    
    res.json({
      active: activeChallenges,
      completed: completedChallenges
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/challenges/:id/join
// @desc    Join a challenge
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user already joined this challenge
    if (user.activeChallenges.includes(challenge._id)) {
      return res.status(400).json({ msg: 'Already joined this challenge' });
    }
    
    // Check if user already completed this challenge
    if (user.completedChallenges.includes(challenge._id)) {
      return res.status(400).json({ msg: 'Already completed this challenge' });
    }
    
    // Add challenge to user's active challenges
    user.activeChallenges.push(challenge._id);
    
    // Increment participants count
    challenge.participants += 1;
    
    await user.save();
    await challenge.save();
    
    res.json({
      msg: 'Challenge joined successfully',
      challenge
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/challenges/:id/complete
// @desc    Complete a challenge
// @access  Private
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user has joined this challenge
    if (!user.activeChallenges.includes(challenge._id)) {
      return res.status(400).json({ msg: 'You have not joined this challenge' });
    }
    
    // Check if user already completed this challenge
    if (user.completedChallenges.includes(challenge._id)) {
      return res.status(400).json({ msg: 'Already completed this challenge' });
    }
    
    // Remove challenge from active challenges
    user.activeChallenges = user.activeChallenges.filter(
      id => id.toString() !== challenge._id.toString()
    );
    
    // Add challenge to completed challenges
    user.completedChallenges.push(challenge._id);
    
    // Increment completions count
    challenge.completions += 1;
    
    // Add XP to user
    user.xp += challenge.xpReward;
    
    // Check if user leveled up
    const xpNeededForNextLevel = user.level * 100;
    let leveledUp = false;
    
    if (user.xp >= xpNeededForNextLevel) {
      user.level += 1;
      leveledUp = true;
    }
    
    await user.save();
    await challenge.save();
    
    res.json({
      msg: 'Challenge completed successfully',
      challenge,
      user: {
        id: user._id,
        xp: user.xp,
        level: user.level
      },
      xpGained: challenge.xpReward,
      leveledUp
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/challenges/:id/leave
// @desc    Leave a challenge
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if user has joined this challenge
    if (!user.activeChallenges.includes(challenge._id)) {
      return res.status(400).json({ msg: 'You have not joined this challenge' });
    }
    
    // Remove challenge from active challenges
    user.activeChallenges = user.activeChallenges.filter(
      id => id.toString() !== challenge._id.toString()
    );
    
    // Decrement participants count
    if (challenge.participants > 0) {
      challenge.participants -= 1;
    }
    
    await user.save();
    await challenge.save();
    
    res.json({
      msg: 'Challenge left successfully',
      challenge
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/challenges/:id
// @desc    Get challenge by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Admin routes for challenge management

// @route   POST api/challenges
// @desc    Create a new challenge (admin only)
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement this check)
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const {
      title,
      description,
      type,
      difficulty,
      xpReward,
      date,
      duration,
      requirements
    } = req.body;
    
    const newChallenge = new Challenge({
      title,
      description,
      type,
      difficulty,
      xpReward,
      date: date || Date.now(),
      duration,
      requirements
    });
    
    const challenge = await newChallenge.save();
    
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/challenges/:id
// @desc    Update a challenge (admin only)
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    const {
      title,
      description,
      type,
      difficulty,
      xpReward,
      date,
      duration,
      requirements
    } = req.body;
    
    // Update fields
    if (title) challenge.title = title;
    if (description) challenge.description = description;
    if (type) challenge.type = type;
    if (difficulty) challenge.difficulty = difficulty;
    if (xpReward) challenge.xpReward = xpReward;
    if (date) challenge.date = date;
    if (duration) challenge.duration = duration;
    if (requirements) challenge.requirements = requirements;
    
    await challenge.save();
    
    res.json(challenge);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/challenges/:id
// @desc    Delete a challenge (admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    
    await challenge.remove();
    
    res.json({ msg: 'Challenge removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 