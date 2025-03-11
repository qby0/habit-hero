const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const Habit = require('../models/Habit');
const mongoose = require('mongoose');

// Получение глобальной таблицы лидеров
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Находим или создаем глобальную таблицу лидеров
    let leaderboard = await Leaderboard.findOne({ type: 'global' });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        type: 'global',
        entries: []
      });
      await leaderboard.save();
    }
    
    // Получаем топ-N пользователей
    const topUsers = leaderboard.getTopUsers(Number(limit));
    
    // Получаем позицию текущего пользователя
    const userPosition = leaderboard.getUserPosition(req.user.id);
    
    res.status(200).json({
      topUsers,
      userPosition: userPosition.found ? userPosition : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение еженедельной таблицы лидеров
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Определяем текущую неделю
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Начало текущей недели (воскресенье)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Конец недели (суббота)
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Находим или создаем таблицу лидеров для текущей недели
    let leaderboard = await Leaderboard.findOne({
      type: 'weekly',
      'period.startDate': { $gte: startOfWeek },
      'period.endDate': { $lte: endOfWeek }
    });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        type: 'weekly',
        period: {
          startDate: startOfWeek,
          endDate: endOfWeek
        },
        entries: []
      });
      await leaderboard.save();
    }
    
    // Получаем топ-N пользователей
    const topUsers = leaderboard.getTopUsers(Number(limit));
    
    // Получаем позицию текущего пользователя
    const userPosition = leaderboard.getUserPosition(req.user.id);
    
    res.status(200).json({
      topUsers,
      userPosition: userPosition.found ? userPosition : null,
      period: {
        startDate: leaderboard.period.startDate,
        endDate: leaderboard.period.endDate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение таблицы лидеров по категории
exports.getCategoryLeaderboard = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;
    
    // Проверяем, что категория допустима
    const allowedCategories = ['health', 'productivity', 'relationships', 'learning', 'other'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    // Находим или создаем таблицу лидеров для категории
    let leaderboard = await Leaderboard.findOne({
      type: 'category',
      category
    });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        type: 'category',
        category,
        entries: []
      });
      await leaderboard.save();
    }
    
    // Получаем топ-N пользователей
    const topUsers = leaderboard.getTopUsers(Number(limit));
    
    // Получаем позицию текущего пользователя
    const userPosition = leaderboard.getUserPosition(req.user.id);
    
    res.status(200).json({
      category,
      topUsers,
      userPosition: userPosition.found ? userPosition : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение таблицы лидеров по сериям (стрикам)
exports.getStreakLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Находим или создаем таблицу лидеров по сериям
    let leaderboard = await Leaderboard.findOne({ type: 'streak' });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        type: 'streak',
        entries: []
      });
      await leaderboard.save();
    }
    
    // Получаем топ-N пользователей
    const topUsers = leaderboard.getTopUsers(Number(limit));
    
    // Получаем позицию текущего пользователя
    const userPosition = leaderboard.getUserPosition(req.user.id);
    
    res.status(200).json({
      topUsers,
      userPosition: userPosition.found ? userPosition : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновление метрик пользователя для таблицы лидеров
exports.updateUserMetrics = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    // Собираем метрики пользователя
    const habits = await Habit.find({ user: userId });
    
    // Метрики для обычных привычек
    const positiveHabits = habits.filter(h => !h.isNegative);
    const habitsCompleted = positiveHabits.reduce((acc, habit) => 
      acc + habit.completionHistory.filter(c => c.completed).length, 0);
    
    const maxStreak = positiveHabits.reduce((max, habit) => 
      habit.streak > max ? habit.streak : max, 0);
    
    // Метрики для негативных привычек
    const negativeHabits = habits.filter(h => h.isNegative);
    const maxAbstainDays = negativeHabits.reduce((max, habit) => 
      habit.maxAbstainDays > max ? habit.maxAbstainDays : max, 0);
    
    // Считаем дни активности (дни, когда была выполнена хотя бы одна привычка)
    const allDates = new Set();
    habits.forEach(habit => {
      habit.completionHistory.forEach(completion => {
        const date = new Date(completion.date);
        date.setHours(0, 0, 0, 0);
        allDates.add(date.toISOString().split('T')[0]);
      });
    });
    const daysActive = allDates.size;
    
    // Создаем объект метрик
    const metrics = {
      habitsCompleted,
      challengesCompleted: 0, // Заглушка, будет обновляться отдельно
      maxStreak,
      xpEarned: user.xp, // Текущий опыт пользователя
      daysActive
    };
    
    // Обновляем метрики в глобальной таблице лидеров
    let globalLeaderboard = await Leaderboard.findOne({ type: 'global' });
    if (!globalLeaderboard) {
      globalLeaderboard = new Leaderboard({
        type: 'global',
        entries: []
      });
    }
    await globalLeaderboard.updateUserEntry(userId, metrics);
    
    // Обновляем еженедельную таблицу лидеров
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    let weeklyLeaderboard = await Leaderboard.findOne({
      type: 'weekly',
      'period.startDate': { $gte: startOfWeek },
      'period.endDate': { $lte: endOfWeek }
    });
    
    if (!weeklyLeaderboard) {
      weeklyLeaderboard = new Leaderboard({
        type: 'weekly',
        period: {
          startDate: startOfWeek,
          endDate: endOfWeek
        },
        entries: []
      });
    }
    await weeklyLeaderboard.updateUserEntry(userId, metrics);
    
    // Обновляем таблицы лидеров по категориям
    const categoryMetrics = {};
    positiveHabits.forEach(habit => {
      if (!categoryMetrics[habit.category]) {
        categoryMetrics[habit.category] = {
          habitsCompleted: 0,
          maxStreak: 0
        };
      }
      
      const completedCount = habit.completionHistory.filter(c => c.completed).length;
      categoryMetrics[habit.category].habitsCompleted += completedCount;
      
      if (habit.streak > categoryMetrics[habit.category].maxStreak) {
        categoryMetrics[habit.category].maxStreak = habit.streak;
      }
    });
    
    for (const category in categoryMetrics) {
      let categoryLeaderboard = await Leaderboard.findOne({
        type: 'category',
        category
      });
      
      if (!categoryLeaderboard) {
        categoryLeaderboard = new Leaderboard({
          type: 'category',
          category,
          entries: []
        });
      }
      
      await categoryLeaderboard.updateUserEntry(userId, {
        habitsCompleted: categoryMetrics[category].habitsCompleted,
        maxStreak: categoryMetrics[category].maxStreak,
        xpEarned: user.xp,
        daysActive
      });
    }
    
    // Обновляем таблицу стриков
    let streakLeaderboard = await Leaderboard.findOne({ type: 'streak' });
    if (!streakLeaderboard) {
      streakLeaderboard = new Leaderboard({
        type: 'streak',
        entries: []
      });
    }
    
    // Для таблицы стриков используем особые правила начисления
    streakLeaderboard.scoringRules = {
      habitCompletion: 0,
      challengeCompletion: 0,
      streakFactor: 10,
      xpFactor: 0,
      activeDay: 0
    };
    
    await streakLeaderboard.updateUserEntry(userId, {
      maxStreak,
      habitsCompleted: 0, // Не учитываем для таблицы стриков
      xpEarned: 0, // Не учитываем для таблицы стриков
      daysActive: 0 // Не учитываем для таблицы стриков
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user metrics:', error);
    return { success: false, error: error.message };
  }
};

module.exports = exports; 