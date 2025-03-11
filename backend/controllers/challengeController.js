const Challenge = require('../models/Challenge');
const User = require('../models/User');
const mongoose = require('mongoose');

// Создание нового испытания
exports.createChallenge = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      category, 
      difficulty,
      requirements,
      rewards,
      timeFrame,
      isSystem = false,
      group = null
    } = req.body;
    
    // Базовые проверки
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    // Создаем новое испытание
    const newChallenge = new Challenge({
      title,
      description,
      type: type || 'daily',
      category: category || 'mixed',
      difficulty: difficulty || 'medium',
      requirements: requirements || {
        habitCount: 1,
        habitCategory: 'any',
        requireCombo: false
      },
      rewards: rewards || {
        xp: 50,
        coins: 10
      },
      timeFrame: timeFrame || {
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // По умолчанию 1 день
      },
      isSystem,
      creator: isSystem ? null : req.user.id,
      group
    });
    
    await newChallenge.save();
    
    // Если пользователь создал испытание, автоматически делаем его участником
    if (!isSystem) {
      await newChallenge.joinChallenge(req.user.id);
    }
    
    res.status(201).json(newChallenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение доступных испытаний для пользователя
exports.getAvailableChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Получаем все активные системные испытания
    const systemChallenges = await Challenge.find({
      isSystem: true,
      'timeFrame.startDate': { $lte: now },
      'timeFrame.endDate': { $gte: now }
    });
    
    // Получаем испытания из групп пользователя
    const Group = mongoose.model('Group');
    const userGroups = await Group.find({
      'members.user': userId,
      'members.status': 'active'
    });
    
    const groupIds = userGroups.map(g => g._id);
    
    const groupChallenges = await Challenge.find({
      group: { $in: groupIds },
      'timeFrame.startDate': { $lte: now },
      'timeFrame.endDate': { $gte: now }
    }).populate('group', 'name');
    
    // Проверяем, в каких испытаниях участвует пользователь
    const allChallenges = [...systemChallenges, ...groupChallenges];
    
    const challengesWithStatus = allChallenges.map(challenge => {
      const participant = challenge.participants.find(p => p.user.toString() === userId.toString());
      return {
        ...challenge.toObject(),
        userStatus: participant ? participant.status : null,
        isParticipant: !!participant
      };
    });
    
    // Разделяем испытания на активные, выполненные и доступные
    const activeChallenges = challengesWithStatus.filter(c => c.isParticipant && c.userStatus === 'active');
    const completedChallenges = challengesWithStatus.filter(c => c.isParticipant && c.userStatus === 'completed');
    const availableChallenges = challengesWithStatus.filter(c => !c.isParticipant);
    
    res.status(200).json({
      active: activeChallenges,
      completed: completedChallenges,
      available: availableChallenges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Присоединение к испытанию
exports.joinChallenge = async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Проверяем, не истекло ли время испытания
    const now = new Date();
    if (now > challenge.timeFrame.endDate) {
      return res.status(400).json({ message: 'Challenge has expired' });
    }
    
    // Для групповых испытаний проверяем, является ли пользователь членом группы
    if (challenge.group) {
      const Group = mongoose.model('Group');
      const group = await Group.findById(challenge.group);
      
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      const isMember = group.members.some(m => m.user.toString() === userId.toString() && m.status === 'active');
      
      if (!isMember) {
        return res.status(403).json({ message: 'You must be a member of the group to join this challenge' });
      }
    }
    
    // Присоединяемся к испытанию
    const result = await challenge.joinChallenge(userId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({ message: 'Successfully joined the challenge' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Проверка выполнения испытания
exports.checkChallengeCompletion = async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Проверяем выполнение испытания
    const result = await challenge.checkCompletion(userId);
    
    if (result.completed) {
      // Обновляем пользователя, добавляя награды
      const user = await User.findById(userId);
      
      user.xp += challenge.rewards.xp;
      user.coins += challenge.rewards.coins;
      
      // Проверяем на повышение уровня
      const oldLevel = user.level;
      const xpForNextLevel = (user.level * 100) + 50;
      
      if (user.xp >= xpForNextLevel) {
        user.level += 1;
        user.xp = user.xp - xpForNextLevel;
      }
      
      await user.save();
      
      // Если это групповое испытание, обновляем статистику группы
      if (challenge.group) {
        const Group = mongoose.model('Group');
        const group = await Group.findById(challenge.group);
        
        if (group) {
          // Находим участника в группе
          const memberIndex = group.members.findIndex(m => m.user.toString() === userId.toString());
          
          if (memberIndex !== -1) {
            // Обновляем статистику участника
            group.members[memberIndex].contribution.challenges += 1;
            group.members[memberIndex].contribution.points += 10;
            
            // Обновляем общую статистику группы
            group.stats.totalCompletedChallenges += 1;
            
            await group.save();
          }
        }
      }
      
      res.status(200).json({
        completed: true,
        message: 'Challenge completed successfully',
        rewards: challenge.rewards,
        levelUp: user.level > oldLevel,
        newLevel: user.level > oldLevel ? user.level : null
      });
    } else {
      res.status(200).json({
        completed: false,
        message: result.message,
        progress: result.progress,
        target: result.target
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение деталей испытания
exports.getChallengeDetails = async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;
    
    const challenge = await Challenge.findById(challengeId)
      .populate('creator', 'username')
      .populate('group', 'name');
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Получаем статус пользователя в испытании
    const participant = challenge.participants.find(p => p.user.toString() === userId.toString());
    
    // Получаем 5 лучших участников испытания
    const topParticipants = await Promise.all(
      challenge.participants
        .filter(p => p.status === 'completed')
        .sort((a, b) => a.completedAt - b.completedAt)
        .slice(0, 5)
        .map(async p => {
          const user = await User.findById(p.user).select('username');
          return {
            userId: p.user,
            username: user ? user.username : 'Unknown User',
            completedAt: p.completedAt
          };
        })
    );
    
    const response = {
      ...challenge.toObject(),
      isParticipant: !!participant,
      userStatus: participant ? participant.status : null,
      topParticipants
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Создание ежедневных испытаний (запускается по расписанию)
exports.generateDailyChallenges = async () => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    
    // Проверяем, не созданы ли уже испытания на сегодня
    const existingChallenges = await Challenge.find({
      isSystem: true,
      type: 'daily',
      'timeFrame.startDate': {
        $gte: currentDate,
        $lt: tomorrowDate
      }
    });
    
    if (existingChallenges.length > 0) {
      console.log(`Daily challenges for ${currentDate.toISOString().split('T')[0]} already exist`);
      return;
    }
    
    // Создаем набор ежедневных испытаний
    const dailyChallenges = [
      // Испытание 1: Выполнить 3 привычки
      {
        title: 'Daily Triple',
        description: 'Complete any 3 habits today to earn bonus rewards!',
        category: 'mixed',
        difficulty: 'easy',
        requirements: {
          habitCount: 3,
          habitCategory: 'any',
          requireCombo: false
        },
        rewards: {
          xp: 50,
          coins: 15
        }
      },
      // Испытание 2: Выполнить 2 привычки здоровья
      {
        title: 'Health Focus',
        description: 'Complete 2 health & fitness habits today for a special reward.',
        category: 'health',
        difficulty: 'medium',
        requirements: {
          habitCount: 2,
          habitCategory: 'health',
          requireCombo: false
        },
        rewards: {
          xp: 75,
          coins: 20
        }
      },
      // Испытание 3: Комбо из 2 привычек
      {
        title: 'Combo Master',
        description: 'Complete 2 habits in a row (combo) for an extra boost!',
        category: 'mixed',
        difficulty: 'hard',
        requirements: {
          habitCount: 2,
          habitCategory: 'any',
          requireCombo: true
        },
        rewards: {
          xp: 100,
          coins: 25
        }
      }
    ];
    
    // Устанавливаем временные рамки для испытаний (сегодня)
    const timeFrame = {
      startDate: currentDate,
      endDate: tomorrowDate
    };
    
    // Создаем испытания в базе данных
    for (const challengeData of dailyChallenges) {
      const challenge = new Challenge({
        ...challengeData,
        type: 'daily',
        isSystem: true,
        timeFrame
      });
      
      await challenge.save();
      console.log(`Created daily challenge: ${challenge.title}`);
    }
    
    console.log(`Generated ${dailyChallenges.length} daily challenges for ${currentDate.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error('Error generating daily challenges:', error);
  }
};

module.exports = exports; 