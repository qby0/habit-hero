import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Необходима авторизация');
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
          setError('Не удалось загрузить достижения');
        }
      } catch (err) {
        setError('Ошибка при загрузке достижений');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAchievements();
  }, []);
  
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
  
  // Перевод редкости на русский
  const getRarityText = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'Обычное';
      case 'uncommon':
        return 'Необычное';
      case 'rare':
        return 'Редкое';
      case 'epic':
        return 'Эпическое';
      case 'legendary':
        return 'Легендарное';
      default:
        return 'Неизвестно';
    }
  };
  
  // Получение иконки на основе типа
  const getTypeText = (type) => {
    switch (type) {
      case 'streak':
        return 'Серия';
      case 'completions':
        return 'Выполнения';
      case 'level':
        return 'Уровень';
      case 'habits':
        return 'Привычки';
      default:
        return 'Другое';
    }
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
        Достижения
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Разблокируйте достижения, выполняя привычки и повышая уровень.
      </Typography>
      
      {achievements.length === 0 ? (
        <Alert severity="info">
          Нет доступных достижений. Начните с создания привычек!
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
                    {achievement.title}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {achievement.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={`${achievement.experienceReward} XP`} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    
                    <Chip 
                      label={`${achievement.coinsReward} монет`} 
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
                        ✓ Разблокировано
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