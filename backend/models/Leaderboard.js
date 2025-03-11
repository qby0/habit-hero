const mongoose = require('mongoose');

// Схема для таблицы лидеров
const leaderboardSchema = new mongoose.Schema({
  // Тип таблицы лидеров
  type: {
    type: String,
    enum: ['global', 'weekly', 'monthly', 'category', 'streak', 'group'],
    required: true
  },
  // Категория (если тип 'category')
  category: {
    type: String,
    enum: ['health', 'productivity', 'relationships', 'learning', 'other', null],
    default: null
  },
  // Ссылка на группу (если тип 'group')
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  // Период (для еженедельных и ежемесячных рейтингов)
  period: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  // Записи рейтинга
  entries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String
    },
    avatar: {
      type: String
    },
    level: {
      type: Number
    },
    score: {
      type: Number,
      default: 0
    },
    // Метрики успеха
    metrics: {
      habitsCompleted: {
        type: Number,
        default: 0
      },
      challengesCompleted: {
        type: Number,
        default: 0
      },
      maxStreak: {
        type: Number,
        default: 0
      },
      xpEarned: {
        type: Number,
        default: 0
      },
      daysActive: {
        type: Number,
        default: 0
      }
    },
    // Предыдущее место в рейтинге (для отслеживания изменений)
    previousRank: {
      type: Number,
      default: 0
    },
    // Текущее место
    rank: {
      type: Number
    },
    // Изменение в рейтинге
    rankChange: {
      type: Number,
      default: 0
    },
    // Временная метка последнего обновления
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  // Метаданные таблицы лидеров
  metadata: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    avgScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Правила расчета очков
  scoringRules: {
    habitCompletion: {
      type: Number,
      default: 10
    },
    challengeCompletion: {
      type: Number,
      default: 50
    },
    streakFactor: {
      type: Number,
      default: 2
    },
    xpFactor: {
      type: Number,
      default: 0.5
    },
    activeDay: {
      type: Number,
      default: 5
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Метод для обновления записи пользователя
leaderboardSchema.methods.updateUserEntry = async function(userId, metrics) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  // Ищем запись пользователя или создаем новую
  let entryIndex = this.entries.findIndex(e => e.user.toString() === userId.toString());
  let isNewEntry = false;
  
  if (entryIndex === -1) {
    // Новый пользователь - добавляем запись
    this.entries.push({
      user: userId,
      username: user.username,
      avatar: user.avatar || 'default_avatar.png',
      level: user.level || 1,
      score: 0,
      metrics: {
        habitsCompleted: 0,
        challengesCompleted: 0,
        maxStreak: 0,
        xpEarned: 0,
        daysActive: 0
      },
      previousRank: 0,
      rank: this.entries.length + 1,
      rankChange: 0,
      lastUpdated: new Date()
    });
    entryIndex = this.entries.length - 1;
    isNewEntry = true;
    this.metadata.totalParticipants += 1;
  }
  
  // Сохраняем предыдущий ранг
  this.entries[entryIndex].previousRank = this.entries[entryIndex].rank || 0;
  
  // Обновляем метрики
  if (metrics) {
    if (metrics.habitsCompleted !== undefined) {
      this.entries[entryIndex].metrics.habitsCompleted = metrics.habitsCompleted;
    }
    if (metrics.challengesCompleted !== undefined) {
      this.entries[entryIndex].metrics.challengesCompleted = metrics.challengesCompleted;
    }
    if (metrics.maxStreak !== undefined) {
      this.entries[entryIndex].metrics.maxStreak = metrics.maxStreak;
    }
    if (metrics.xpEarned !== undefined) {
      this.entries[entryIndex].metrics.xpEarned = metrics.xpEarned;
    }
    if (metrics.daysActive !== undefined) {
      this.entries[entryIndex].metrics.daysActive = metrics.daysActive;
    }
  }
  
  // Обновляем основную информацию
  this.entries[entryIndex].username = user.username;
  this.entries[entryIndex].avatar = user.avatar || 'default_avatar.png';
  this.entries[entryIndex].level = user.level || 1;
  this.entries[entryIndex].lastUpdated = new Date();
  
  // Рассчитываем новое значение очков на основе метрик и правил начисления
  const newScore = this.calculateScore(this.entries[entryIndex].metrics);
  this.entries[entryIndex].score = newScore;
  
  // Обновляем временную метку последнего обновления
  this.metadata.lastUpdated = new Date();
  this.updatedAt = new Date();
  
  // Сортируем записи по убыванию очков
  this.entries.sort((a, b) => b.score - a.score);
  
  // Пересчитываем ранги
  this.entries.forEach((entry, index) => {
    entry.rank = index + 1;
    entry.rankChange = entry.previousRank ? entry.previousRank - entry.rank : 0;
  });
  
  // Обновляем метаданные
  let totalScore = 0;
  let highestScore = 0;
  
  this.entries.forEach(entry => {
    totalScore += entry.score;
    if (entry.score > highestScore) {
      highestScore = entry.score;
    }
  });
  
  this.metadata.avgScore = this.entries.length > 0 ? Math.round(totalScore / this.entries.length) : 0;
  this.metadata.highestScore = highestScore;
  
  await this.save();
  
  return {
    success: true,
    entry: this.entries.find(e => e.user.toString() === userId.toString()),
    isNewEntry
  };
};

// Метод для расчета очков на основе метрик
leaderboardSchema.methods.calculateScore = function(metrics) {
  let score = 0;
  
  // Очки за выполненные привычки
  score += metrics.habitsCompleted * this.scoringRules.habitCompletion;
  
  // Очки за выполненные испытания
  score += metrics.challengesCompleted * this.scoringRules.challengeCompletion;
  
  // Бонус за длительную серию
  score += metrics.maxStreak * this.scoringRules.streakFactor;
  
  // Очки за полученный опыт
  score += metrics.xpEarned * this.scoringRules.xpFactor;
  
  // Очки за активные дни
  score += metrics.daysActive * this.scoringRules.activeDay;
  
  return Math.round(score);
};

// Метод для получения топ-N участников
leaderboardSchema.methods.getTopUsers = function(limit = 10) {
  return this.entries
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(entry => ({
      rank: entry.rank,
      username: entry.username,
      avatar: entry.avatar,
      level: entry.level,
      score: entry.score,
      rankChange: entry.rankChange,
      userId: entry.user
    }));
};

// Метод для получения позиции конкретного пользователя
leaderboardSchema.methods.getUserPosition = function(userId) {
  const entry = this.entries.find(e => e.user.toString() === userId.toString());
  
  if (!entry) {
    return { found: false, message: 'User not in leaderboard' };
  }
  
  // Находим соседние записи в рейтинге
  const userRank = entry.rank;
  
  // Находим двух пользователей выше в рейтинге
  const usersAbove = this.entries
    .filter(e => e.rank < userRank)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 2);
  
  // Находим двух пользователей ниже в рейтинге
  const usersBelow = this.entries
    .filter(e => e.rank > userRank)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 2);
  
  return {
    found: true,
    userEntry: {
      rank: entry.rank,
      username: entry.username,
      avatar: entry.avatar,
      level: entry.level,
      score: entry.score,
      rankChange: entry.rankChange,
      metrics: entry.metrics
    },
    usersAbove: usersAbove.map(e => ({
      rank: e.rank,
      username: e.username,
      avatar: e.avatar,
      level: e.level,
      score: e.score
    })),
    usersBelow: usersBelow.map(e => ({
      rank: e.rank,
      username: e.username,
      avatar: e.avatar,
      level: e.level,
      score: e.score
    }))
  };
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard; 