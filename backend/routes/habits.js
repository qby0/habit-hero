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

// Workshop Routes - должны быть перед маршрутами с параметрами для избежания конфликтов

// @route   GET api/habits/workshop
// @desc    Get all public habits for workshop
// @access  Private
router.get('/workshop', habitController.getPublicHabits);

// @route   GET api/habits/workshop/:id
// @desc    Get a single public habit
// @access  Private
router.get('/workshop/:id', habitController.getPublicHabit);

// Маршруты для конкретных привычек

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

// @route   PUT api/habits/:id/complete
// @desc    Complete a habit
// @access  Private
router.put('/:id/complete', habitController.completeHabit);

// @route   POST api/habits/:id/rate
// @desc    Rate a public habit
// @access  Private
router.post('/:id/rate', habitController.rateHabit);

// @route   POST api/habits/:id/comment
// @desc    Comment on a public habit
// @access  Private
router.post('/:id/comment', habitController.commentHabit);

// @route   POST api/habits/:id/import
// @desc    Import a public habit to user's habits
// @access  Private
router.post('/:id/import', habitController.importHabit);

module.exports = router; 