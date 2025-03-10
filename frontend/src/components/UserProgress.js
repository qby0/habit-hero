import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { LocalFireDepartment as FireIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const UserProgress = ({ user }) => {
  const { t } = useTranslation();
  
  if (!user) return null;
  
  const { level, experience, streak, coins } = user;
  
  // Calculate XP progress to next level
  const nextLevelXP = level * 100;
  const progress = (experience / nextLevelXP) * 100;
  
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('profile.level')} {level}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {experience}/{nextLevelXP} XP
        </Typography>
      </Box>
      
      <div className="progress-container">
        <div 
          className="progress-bar progress-xp" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Chip
          icon={<FireIcon sx={{ color: '#ff7043 !important' }} />}
          label={`${streak} ${t('habits.dayStreak')}`}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: '#ff7043',
            color: '#ff7043',
            '& .MuiChip-label': { fontWeight: 500 }
          }}
        />
        
        <Chip
          icon={<TrophyIcon sx={{ color: '#ffc107 !important' }} />}
          label={`${coins} ${t('habits.coins')}`}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: '#ffc107',
            color: '#ffc107',
            '& .MuiChip-label': { fontWeight: 500 }
          }}
        />
      </Box>
    </Box>
  );
};

export default UserProgress; 