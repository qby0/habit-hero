const Group = require('../models/Group');
const User = require('../models/User');
const mongoose = require('mongoose');

// Создание новой группы
exports.createGroup = async (req, res) => {
  try {
    const { name, description, type, category, goal, settings } = req.body;
    
    // Базовые проверки
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    // Проверка на уникальность имени группы
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'A group with this name already exists' });
    }
    
    // Создаем новую группу
    const newGroup = new Group({
      name,
      description,
      type: type || 'public',
      category: category || 'mixed',
      goal,
      creator: req.user.id,
      admins: [req.user.id],
      settings: settings || {}
    });
    
    // Добавляем создателя как участника с ролью админа
    newGroup.members.push({
      user: req.user.id,
      joinedAt: new Date(),
      role: 'admin',
      status: 'active',
      contribution: {
        habits: 0,
        challenges: 0,
        points: 0
      }
    });
    
    // Добавляем запись в активность
    newGroup.activity.push({
      type: 'message',
      user: req.user.id,
      message: 'Group created',
      createdAt: new Date()
    });
    
    await newGroup.save();
    
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение групп пользователя
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Находим все группы, где пользователь является участником
    const groups = await Group.find({
      'members.user': userId,
      'members.status': 'active'
    }).select('name description type category goal avatar stats members.user');
    
    // Добавляем доп. информацию к каждой группе
    const groupsWithInfo = await Promise.all(groups.map(async (group) => {
      // Получаем количество активных участников
      const activeMembers = group.members.filter(m => m.status === 'active').length;
      
      // Определяем роль пользователя в группе
      const userMember = group.members.find(m => m.user.toString() === userId.toString());
      const role = userMember ? userMember.role : 'none';
      
      return {
        _id: group._id,
        name: group.name,
        description: group.description,
        type: group.type,
        category: group.category,
        goal: group.goal,
        avatar: group.avatar,
        stats: group.stats,
        activeMembers,
        userRole: role,
        isCreator: group.creator.toString() === userId.toString()
      };
    }));
    
    // Разделяем группы на те, где пользователь админ и где обычный участник
    const adminGroups = groupsWithInfo.filter(g => g.userRole === 'admin' || g.userRole === 'moderator');
    const memberGroups = groupsWithInfo.filter(g => g.userRole === 'member');
    
    res.status(200).json({
      admin: adminGroups,
      member: memberGroups,
      total: groupsWithInfo.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение публичных групп
exports.getPublicGroups = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, sortBy = 'members' } = req.query;
    const userId = req.user.id;
    
    // Создаем базовый фильтр для публичных групп
    const filter = { type: { $in: ['public'] }, isActive: true };
    
    // Фильтр по категории
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Поиск по имени или описанию
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Определяем сортировку
    let sortField = {};
    switch(sortBy) {
      case 'newest':
        sortField = { createdAt: -1 };
        break;
      case 'members':
        sortField = { 'stats.totalParticipants': -1 };
        break;
      case 'activity':
        sortField = { 'stats.activeDays': -1 };
        break;
      default:
        sortField = { 'stats.totalParticipants': -1 };
    }
    
    // Подсчитываем общее количество результатов
    const total = await Group.countDocuments(filter);
    
    // Расчет пагинации
    const skip = (page - 1) * limit;
    
    // Получаем группы
    const groups = await Group.find(filter)
      .select('name description type category creator avatar stats createdAt members')
      .populate('creator', 'username')
      .sort(sortField)
      .skip(skip)
      .limit(Number(limit));
    
    // Определяем, является ли пользователь участником каждой группы
    const groupsWithMembership = groups.map(group => {
      const isMember = group.members.some(m => m.user.toString() === userId.toString() && m.status === 'active');
      
      return {
        ...group.toObject(),
        memberCount: group.members.filter(m => m.status === 'active').length,
        isMember,
        // Удаляем поле members из ответа
        members: undefined
      };
    });
    
    res.status(200).json({
      groups: groupsWithMembership,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Присоединение к группе
exports.joinGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Проверяем, активна ли группа
    if (!group.isActive) {
      return res.status(400).json({ message: 'This group is no longer active' });
    }
    
    // Для закрытых групп нельзя присоединиться
    if (group.type === 'closed') {
      return res.status(403).json({ message: 'This group is closed and not accepting new members' });
    }
    
    // Проверяем минимальный уровень пользователя
    if (group.settings?.minLevel > 0) {
      const user = await User.findById(userId);
      if (user.level < group.settings.minLevel) {
        return res.status(403).json({ 
          message: `You need to be at least level ${group.settings.minLevel} to join this group`,
          requiredLevel: group.settings.minLevel,
          currentLevel: user.level 
        });
      }
    }
    
    // Проверяем, требуется ли одобрение для присоединения
    if (group.type === 'private' || group.settings?.requireApproval) {
      // Проверяем, есть ли уже запрос на вступление
      const existingRequest = group.membershipRequests.find(r => r.user.toString() === userId.toString());
      
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return res.status(400).json({ message: 'You already have a pending request to join this group' });
        } else if (existingRequest.status === 'rejected') {
          return res.status(403).json({ message: 'Your request to join this group was rejected' });
        }
      }
      
      // Создаем новый запрос на вступление
      group.membershipRequests.push({
        user: userId,
        requestedAt: new Date(),
        status: 'pending',
        message: req.body.message || ''
      });
      
      await group.save();
      
      return res.status(200).json({ message: 'Your request to join the group has been submitted and is pending approval' });
    }
    
    // Для публичных групп без требования одобрения - сразу добавляем пользователя
    const result = await group.addMember(userId, 'member');
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.status(200).json({ message: 'Successfully joined the group' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Получение деталей группы
exports.getGroupDetails = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    
    const group = await Group.findById(groupId)
      .populate('creator', 'username')
      .populate('admins', 'username')
      .populate('challenges');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Проверяем, является ли пользователь участником группы
    const userMember = group.members.find(m => m.user.toString() === userId.toString() && m.status === 'active');
    const isMember = !!userMember;
    
    // Если группа приватная и пользователь не участник, ограничиваем доступ
    if (group.type !== 'public' && !isMember) {
      return res.status(403).json({ message: 'You do not have permission to view this group' });
    }
    
    // Получаем таблицу лидеров группы
    const leaderboard = await group.getLeaderboard();
    
    // Получаем список активных участников с именами пользователей
    const activeMembers = await Promise.all(
      group.members
        .filter(m => m.status === 'active')
        .map(async m => {
          const user = await User.findById(m.user).select('username avatar level');
          return {
            userId: m.user,
            username: user ? user.username : 'Unknown User',
            avatar: user ? user.avatar : 'default_avatar.png',
            level: user ? user.level : 1,
            role: m.role,
            joinedAt: m.joinedAt,
            contribution: m.contribution
          };
        })
    );
    
    // Получаем последние записи активности
    const recentActivity = group.activity
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(a => ({
        type: a.type,
        message: a.message,
        createdAt: a.createdAt,
        userId: a.user
      }));
    
    // Получаем запросы на вступление для администраторов
    let membershipRequests = [];
    if (userMember && (userMember.role === 'admin' || userMember.role === 'moderator')) {
      membershipRequests = await Promise.all(
        group.membershipRequests
          .filter(r => r.status === 'pending')
          .map(async r => {
            const user = await User.findById(r.user).select('username');
            return {
              requestId: r._id,
              userId: r.user,
              username: user ? user.username : 'Unknown User',
              requestedAt: r.requestedAt,
              message: r.message
            };
          })
      );
    }
    
    // Формируем ответ
    const response = {
      _id: group._id,
      name: group.name,
      description: group.description,
      type: group.type,
      category: group.category,
      goal: group.goal,
      creator: group.creator,
      avatar: group.avatar,
      stats: group.stats,
      settings: group.settings,
      isMember,
      userRole: userMember ? userMember.role : 'none',
      memberCount: activeMembers.length,
      members: activeMembers,
      leaderboard: leaderboard.slice(0, 10),
      recentActivity,
      challenges: group.challenges.map(c => ({
        _id: c._id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        timeFrame: c.timeFrame,
        stats: c.stats
      })),
      membershipRequests: membershipRequests,
      createdAt: group.createdAt
    };
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Добавление сообщения в активность группы
exports.addGroupActivity = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Проверяем, является ли пользователь участником группы
    const isMember = group.members.some(m => m.user.toString() === userId.toString() && m.status === 'active');
    
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member of the group to post messages' });
    }
    
    // Добавляем сообщение в активность
    group.activity.push({
      type: 'message',
      user: userId,
      message,
      createdAt: new Date()
    });
    
    // Обновляем дату последней активности
    group.stats.lastActiveDate = new Date();
    
    await group.save();
    
    res.status(200).json({ message: 'Message posted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обработка запроса на вступление в группу
exports.handleMembershipRequest = async (req, res) => {
  try {
    const { groupId, requestId, action } = req.body;
    
    if (!groupId || !requestId || !action) {
      return res.status(400).json({ message: 'Group ID, request ID and action are required' });
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ message: 'Action must be either "approve" or "reject"' });
    }
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Проверяем, имеет ли пользователь права для обработки запросов
    const userMember = group.members.find(m => m.user.toString() === req.user.id.toString() && m.status === 'active');
    
    if (!userMember || (userMember.role !== 'admin' && userMember.role !== 'moderator')) {
      return res.status(403).json({ message: 'You do not have permission to handle membership requests' });
    }
    
    // Находим запрос
    const requestIndex = group.membershipRequests.findIndex(r => r._id.toString() === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Membership request not found' });
    }
    
    const request = group.membershipRequests[requestIndex];
    
    // Обновляем статус запроса
    if (action === 'approve') {
      request.status = 'approved';
      
      // Добавляем пользователя в группу
      const result = await group.addMember(request.user, 'member');
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.status(200).json({ message: 'Membership request approved' });
    } else {
      request.status = 'rejected';
      await group.save();
      
      res.status(200).json({ message: 'Membership request rejected' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Обновление настроек группы
exports.updateGroupSettings = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { name, description, type, category, goal, settings, avatar } = req.body;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Проверяем, имеет ли пользователь права для обновления настроек
    const userMember = group.members.find(m => m.user.toString() === req.user.id.toString() && m.status === 'active');
    
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to update group settings' });
    }
    
    // Обновляем поля
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (type) group.type = type;
    if (category) group.category = category;
    if (goal) group.goal = goal;
    if (avatar) group.avatar = avatar;
    
    // Обновляем настройки
    if (settings) {
      if (settings.allowMemberChallenges !== undefined) {
        group.settings.allowMemberChallenges = settings.allowMemberChallenges;
      }
      if (settings.requireApproval !== undefined) {
        group.settings.requireApproval = settings.requireApproval;
      }
      if (settings.minLevel !== undefined) {
        group.settings.minLevel = settings.minLevel;
      }
      if (settings.showLeaderboard !== undefined) {
        group.settings.showLeaderboard = settings.showLeaderboard;
      }
    }
    
    // Добавляем запись в активность
    group.activity.push({
      type: 'message',
      user: req.user.id,
      message: 'Group settings updated',
      createdAt: new Date()
    });
    
    await group.save();
    
    res.status(200).json({
      message: 'Group settings updated successfully',
      group: {
        name: group.name,
        description: group.description,
        type: group.type,
        category: group.category,
        goal: group.goal,
        settings: group.settings,
        avatar: group.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports; 