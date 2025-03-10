const Achievement = require('../models/Achievement');
const User = require('../models/User');

// Get all achievements
exports.getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({ threshold: 1 });
    
    // Get user's earned achievements
    const user = await User.findById(req.user.userId);
    
    // Mark which achievements the user has earned
    const achievementsWithStatus = achievements.map(achievement => {
      const earned = user.achievements.includes(achievement._id);
      return {
        ...achievement.toObject(),
        earned
      };
    });
    
    res.json({ success: true, achievements: achievementsWithStatus });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error fetching achievements' });
  }
};

// Create initial achievements (admin only)
exports.seedAchievements = async (req, res) => {
  try {
    // Check if achievements already exist
    const count = await Achievement.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Achievements already seeded' });
    }
    
    const achievements = [
      // Streak Achievements
      {
        title: 'Consistent',
        description: 'Maintain a 3-day streak on any habit',
        icon: 'fire',
        type: 'streak',
        threshold: 3,
        experienceReward: 20,
        coinsReward: 10,
        rarity: 'common'
      },
      {
        title: 'Dedicated',
        description: 'Maintain a 7-day streak on any habit',
        icon: 'fire',
        type: 'streak',
        threshold: 7,
        experienceReward: 50,
        coinsReward: 25,
        rarity: 'uncommon'
      },
      {
        title: 'Committed',
        description: 'Maintain a 30-day streak on any habit',
        icon: 'medal',
        type: 'streak',
        threshold: 30,
        experienceReward: 200,
        coinsReward: 100,
        rarity: 'rare'
      },
      {
        title: 'Master of Habit',
        description: 'Maintain a 100-day streak on any habit',
        icon: 'crown',
        type: 'streak',
        threshold: 100,
        experienceReward: 500,
        coinsReward: 250,
        rarity: 'legendary'
      },
      
      // Completion Achievements
      {
        title: 'Beginner',
        description: 'Complete 10 habit tasks',
        icon: 'check',
        type: 'completions',
        threshold: 10,
        experienceReward: 30,
        coinsReward: 15,
        rarity: 'common'
      },
      {
        title: 'Intermediate',
        description: 'Complete 50 habit tasks',
        icon: 'check-double',
        type: 'completions',
        threshold: 50,
        experienceReward: 100,
        coinsReward: 50,
        rarity: 'uncommon'
      },
      {
        title: 'Expert',
        description: 'Complete 200 habit tasks',
        icon: 'award',
        type: 'completions',
        threshold: 200,
        experienceReward: 300,
        coinsReward: 150,
        rarity: 'rare'
      },
      {
        title: 'Habit Guru',
        description: 'Complete 1000 habit tasks',
        icon: 'trophy',
        type: 'completions',
        threshold: 1000,
        experienceReward: 1000,
        coinsReward: 500,
        rarity: 'legendary'
      },
      
      // Level Achievements
      {
        title: 'Level 5',
        description: 'Reach level 5',
        icon: 'arrow-up',
        type: 'level',
        threshold: 5,
        experienceReward: 100,
        coinsReward: 50,
        rarity: 'common'
      },
      {
        title: 'Level 10',
        description: 'Reach level 10',
        icon: 'arrow-up-circle',
        type: 'level',
        threshold: 10,
        experienceReward: 200,
        coinsReward: 100,
        rarity: 'uncommon'
      },
      {
        title: 'Level 25',
        description: 'Reach level 25',
        icon: 'star',
        type: 'level',
        threshold: 25,
        experienceReward: 500,
        coinsReward: 250,
        rarity: 'rare'
      },
      {
        title: 'Level 50',
        description: 'Reach level 50',
        icon: 'star-fill',
        type: 'level',
        threshold: 50,
        experienceReward: 1000,
        coinsReward: 500,
        rarity: 'epic'
      },
      {
        title: 'Level 100',
        description: 'Reach level 100',
        icon: 'crown',
        type: 'level',
        threshold: 100,
        experienceReward: 2000,
        coinsReward: 1000,
        rarity: 'legendary'
      },
      
      // Habit Creation Achievements
      {
        title: 'Habit Starter',
        description: 'Create 3 habits',
        icon: 'list',
        type: 'habits',
        threshold: 3,
        experienceReward: 30,
        coinsReward: 15,
        rarity: 'common'
      },
      {
        title: 'Habit Collector',
        description: 'Create 10 habits',
        icon: 'list-check',
        type: 'habits',
        threshold: 10,
        experienceReward: 100,
        coinsReward: 50,
        rarity: 'uncommon'
      },
      {
        title: 'Habit Enthusiast',
        description: 'Create 20 habits',
        icon: 'list-stars',
        type: 'habits',
        threshold: 20,
        experienceReward: 200,
        coinsReward: 100,
        rarity: 'rare'
      }
    ];
    
    await Achievement.insertMany(achievements);
    
    res.status(201).json({ success: true, message: 'Achievements seeded successfully', count: achievements.length });
  } catch (error) {
    console.error('Seed achievements error:', error);
    res.status(500).json({ message: 'Server error seeding achievements' });
  }
}; 