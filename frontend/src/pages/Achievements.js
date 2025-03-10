import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Словарь переводов для заголовков достижений
const achievementTitles = {
  // Streak Achievements
  'Consistent': {
    ru: 'Последовательный',
    uk: 'Послідовний',
    sk: 'Konzistentný'
  },
  'Dedicated': {
    ru: 'Преданный',
    uk: 'Відданий',
    sk: 'Oddaný'
  },
  'Committed': {
    ru: 'Приверженный',
    uk: 'Прихильний',
    sk: 'Angažovaný'
  },
  'Master of Habit': {
    ru: 'Мастер привычки',
    uk: 'Майстер звички',
    sk: 'Majster návyku'
  },
  
  // Completion Achievements
  'Beginner': {
    ru: 'Начинающий',
    uk: 'Початківець',
    sk: 'Začiatočník'
  },
  'Intermediate': {
    ru: 'Средний уровень',
    uk: 'Середній рівень',
    sk: 'Stredná úroveň'
  },
  'Expert': {
    ru: 'Эксперт',
    uk: 'Експерт',
    sk: 'Expert'
  },
  'Habit Guru': {
    ru: 'Гуру привычек',
    uk: 'Гуру звичок',
    sk: 'Guru návykov'
  },
  
  // Level Achievements
  'Level 5': {
    ru: 'Уровень 5',
    uk: 'Рівень 5',
    sk: 'Úroveň 5'
  },
  'Level 10': {
    ru: 'Уровень 10',
    uk: 'Рівень 10',
    sk: 'Úroveň 10'
  },
  'Level 25': {
    ru: 'Уровень 25',
    uk: 'Рівень 25',
    sk: 'Úroveň 25'
  },
  'Level 50': {
    ru: 'Уровень 50',
    uk: 'Рівень 50',
    sk: 'Úroveň 50'
  },
  'Level 100': {
    ru: 'Уровень 100',
    uk: 'Рівень 100',
    sk: 'Úroveň 100'
  },
  
  // Habit Creation Achievements
  'Habit Starter': {
    ru: 'Создатель привычек',
    uk: 'Творець звичок',
    sk: 'Tvorca návykov'
  },
  'Habit Collector': {
    ru: 'Коллекционер привычек',
    uk: 'Колекціонер звичок',
    sk: 'Zberateľ návykov'
  },
  'Habit Enthusiast': {
    ru: 'Энтузиаст привычек',
    uk: 'Ентузіаст звичок',
    sk: 'Nadšenec návykov'
  }
};

// Словарь переводов для описаний достижений
const achievementDescriptions = {
  'Maintain a 3-day streak on any habit': {
    ru: 'Поддерживайте серию из 3 дней по любой привычке',
    uk: 'Підтримуйте серію з 3 днів по будь-якій звичці',
    sk: 'Udržujte sériu 3 dní na akomkoľvek návyku'
  },
  'Maintain a 7-day streak on any habit': {
    ru: 'Поддерживайте серию из 7 дней по любой привычке',
    uk: 'Підтримуйте серію з 7 днів по будь-якій звичці',
    sk: 'Udržujte sériu 7 dní na akomkoľvek návyku'
  },
  'Maintain a 30-day streak on any habit': {
    ru: 'Поддерживайте серию из 30 дней по любой привычке',
    uk: 'Підтримуйте серію з 30 днів по будь-якій звичці',
    sk: 'Udržujte sériu 30 dní na akomkoľvek návyku'
  },
  'Maintain a 100-day streak on any habit': {
    ru: 'Поддерживайте серию из 100 дней по любой привычке',
    uk: 'Підтримуйте серію зі 100 днів по будь-якій звичці',
    sk: 'Udržujte sériu 100 dní na akomkoľvek návyku'
  },
  'Complete 10 habit tasks': {
    ru: 'Выполните 10 задач по привычкам',
    uk: 'Виконайте 10 завдань за звичками',
    sk: 'Dokončite 10 úloh návykov'
  },
  'Complete 50 habit tasks': {
    ru: 'Выполните 50 задач по привычкам',
    uk: 'Виконайте 50 завдань за звичками',
    sk: 'Dokončite 50 úloh návykov'
  },
  'Complete 200 habit tasks': {
    ru: 'Выполните 200 задач по привычкам',
    uk: 'Виконайте 200 завдань за звичками',
    sk: 'Dokončite 200 úloh návykov'
  },
  'Complete 1000 habit tasks': {
    ru: 'Выполните 1000 задач по привычкам',
    uk: 'Виконайте 1000 завдань за звичками',
    sk: 'Dokončite 1000 úloh návykov'
  },
  'Reach level 5': {
    ru: 'Достигните 5 уровня',
    uk: 'Досягніть 5 рівня',
    sk: 'Dosiahnite úroveň 5'
  },
  'Reach level 10': {
    ru: 'Достигните 10 уровня',
    uk: 'Досягніть 10 рівня',
    sk: 'Dosiahnite úroveň 10'
  },
  'Reach level 25': {
    ru: 'Достигните 25 уровня',
    uk: 'Досягніть 25 рівня',
    sk: 'Dosiahnite úroveň 25'
  },
  'Reach level 50': {
    ru: 'Достигните 50 уровня',
    uk: 'Досягніть 50 рівня',
    sk: 'Dosiahnite úroveň 50'
  },
  'Reach level 100': {
    ru: 'Достигните 100 уровня',
    uk: 'Досягніть 100 рівня',
    sk: 'Dosiahnite úroveň 100'
  },
  'Create 3 habits': {
    ru: 'Создайте 3 привычки',
    uk: 'Створіть 3 звички',
    sk: 'Vytvorte 3 návyky'
  },
  'Create 10 habits': {
    ru: 'Создайте 10 привычек',
    uk: 'Створіть 10 звичок',
    sk: 'Vytvorte 10 návykov'
  },
  'Create 20 habits': {
    ru: 'Создайте 20 привычек',
    uk: 'Створіть 20 звичок',
    sk: 'Vytvorte 20 návykov'
  }
};

const Achievements = () => {
  const { t, i18n } = useTranslation();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError(t('errors.serverError'));
          setLoading(false);
          return;
        }
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const res = await axios.get('/api/achievements', config);
        
        if (res.data.success) {
          setAchievements(res.data.achievements);
        } else {
          setError(t('errors.serverError'));
        }
      } catch (err) {
        setError(t('errors.serverError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, [t]);
  
  // Получение цвета на основе редкости
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return { bg: '#e3f2fd', border: '#bbdefb' };
      case 'uncommon':
        return { bg: '#e8f5e9', border: '#c8e6c9' };
      case 'rare':
        return { bg: '#e0f7fa', border: '#b2ebf2' };
      case 'epic':
        return { bg: '#f3e5f5', border: '#e1bee7' };
      case 'legendary':
        return { bg: '#fff8e1', border: '#ffecb3' };
      default:
        return { bg: '#f5f5f5', border: '#e0e0e0' };
    }
  };
  
  // Перевод редкости
  const getRarityText = (rarity) => {
    return t(`achievements.rarities.${rarity}`);
  };
  
  // Получение перевода типа
  const getTypeText = (type) => {
    return t(`achievements.types.${type}`);
  };
  
  // Получение перевода заголовка достижения
  const getTranslatedTitle = (title) => {
    const currentLanguage = i18n.language;
    if (currentLanguage === 'en') return title;
    
    const translations = achievementTitles[title];
    return translations && translations[currentLanguage] ? translations[currentLanguage] : title;
  };
  
  // Получение перевода описания достижения
  const getTranslatedDescription = (description) => {
    const currentLanguage = i18n.language;
    if (currentLanguage === 'en') return description;
    
    const translations = achievementDescriptions[description];
    return translations && translations[currentLanguage] ? translations[currentLanguage] : description;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" gutterBottom>
        {t('achievements.achievements')}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('achievements.achievementsSubtitle')}
      </Typography>
      
      {achievements.length === 0 ? (
        <Alert severity="info">
          {t('achievements.noAchievements')}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {achievements.map((achievement) => {
            const rarityStyle = getRarityColor(achievement.rarity);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={achievement._id}>
                <Paper 
                  elevation={achievement.earned ? 3 : 1}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: rarityStyle.bg,
                    border: `1px solid ${rarityStyle.border}`,
                    opacity: achievement.earned ? 1 : 0.7,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  className={achievement.earned ? 'achievement-earned' : ''}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      label={getRarityText(achievement.rarity)} 
                      size="small"
                      color={achievement.earned ? 'primary' : 'default'}
                      variant={achievement.earned ? 'filled' : 'outlined'}
                    />
                    
                    <Chip 
                      label={getTypeText(achievement.type)} 
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    gutterBottom
                    sx={{ 
                      fontWeight: achievement.earned ? 700 : 500,
                      color: achievement.earned ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {getTranslatedTitle(achievement.title)}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {getTranslatedDescription(achievement.description)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={`${achievement.experienceReward} XP`} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    
                    <Chip 
                      label={`${achievement.coinsReward} ${t('habits.coins')}`} 
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  
                  {achievement.earned && (
                    <Box 
                      sx={{ 
                        mt: 2,
                        pt: 2,
                        borderTop: '1px dashed',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="success.main"
                        sx={{ fontWeight: 700 }}
                      >
                        ✓ {t('achievements.unlocked')}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Achievements; 