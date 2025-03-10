const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const auth = require('../middleware/auth');

// @route   GET api/achievements
// @desc    Get all achievements
// @access  Private
router.get('/', auth, achievementController.getAchievements);

// @route   POST api/achievements/seed
// @desc    Seed initial achievements (admin only in production)
// @access  Public (for development)
router.post('/seed', achievementController.seedAchievements);

module.exports = router; 