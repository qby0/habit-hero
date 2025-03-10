const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET api/habits
// @desc    Get all habits for a user
// @access  Private
router.get('/', habitController.getHabits);

// @route   POST api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', habitController.createHabit);

// @route   GET api/habits/:id
// @desc    Get a single habit
// @access  Private
router.get('/:id', habitController.getHabit);

// @route   PUT api/habits/:id
// @desc    Update a habit
// @access  Private
router.put('/:id', habitController.updateHabit);

// @route   DELETE api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', habitController.deleteHabit);

// @route   POST api/habits/:id/complete
// @desc    Mark a habit as complete for today
// @access  Private
router.post('/:id/complete', habitController.completeHabit);

module.exports = router; 