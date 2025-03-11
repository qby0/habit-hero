import React, { useState, useContext } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const DailyChallengeCard = ({ challenge, onComplete, refreshChallenges }) => {
  const { t } = useTranslation();
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Функция для форматирования даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Функция для определения оставшегося времени
  const getRemainingTime = () => {
    const endDate = new Date(challenge.endDate);
    const now = new Date();
    
    // Если испытание уже закончилось
    if (endDate < now) {
      return t('challenges.expired');
    }
    
    // Рассчитываем оставшееся время
    const diffMs = endDate - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `${diffHrs} ${t('challenges.hours')} ${diffMins} ${t('challenges.minutes')}`;
    } else {
      return `${diffMins} ${t('challenges.minutes')}`;
    }
  };
  
  // Функция для проверки выполнения испытания
  const checkCompletion = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/challenges/${challenge._id}/check`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.completed) {
        toast.success(t('challenges.completedSuccess'));
        if (onComplete) onComplete(challenge._id);
        if (refreshChallenges) refreshChallenges();
      } else {
        toast.info(t('challenges.notCompletedYet'));
      }
    } catch (error) {
      console.error('Error checking challenge completion:', error);
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для присоединения к испытанию
  const joinChallenge = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/challenges/${challenge._id}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success(t('challenges.joinedSuccess'));
      if (refreshChallenges) refreshChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Проверяем, присоединился ли пользователь к испытанию
  const hasJoined = () => {
    return challenge.participants && challenge.participants.includes(user._id);
  };
  
  // Проверяем, выполнено ли испытание
  const isCompleted = () => {
    return challenge.completedBy && challenge.completedBy.includes(user._id);
  };
  
  // Определяем цвет карточки в зависимости от сложности
  const getDifficultyColor = () => {
    switch (challenge.difficulty) {
      case 'easy':
        return 'success.main';
      case 'medium':
        return 'warning.main';
      case 'hard':
        return 'error.main';
      default:
        return 'primary.main';
    }
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        borderLeft: '4px solid',
        borderColor: getDifficultyColor(),
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      {/* Индикатор выполнения */}
      {isCompleted() && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            bgcolor: 'success.main',
            color: 'white',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <CheckCircleIcon fontSize="small" />
        </Box>
      )}
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TrophyIcon sx={{ mr: 1, color: getDifficultyColor() }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {challenge.title}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Chip 
            label={t(`challenges.difficulties.${challenge.difficulty}`)} 
            size="small" 
            sx={{ mr: 1 }}
            className={`badge-${challenge.difficulty}`}
          />
          <Chip 
            label={`+${challenge.xpReward} XP`} 
            size="small"
            icon={<StarIcon fontSize="small" />}
            sx={{ bgcolor: 'rgba(255, 193, 7, 0.1)', color: 'warning.main' }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {challenge.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {t('challenges.timeRemaining')}: {getRemainingTime()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
            {t('challenges.validUntil')}:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatDate(challenge.endDate)}
          </Typography>
        </Box>
        
        {challenge.criteria && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('challenges.criteria')}:
            </Typography>
            <Typography variant="body2">
              {challenge.criteria}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, pt: 1 }}>
        {isCompleted() ? (
          <Button 
            fullWidth 
            variant="contained" 
            color="success" 
            startIcon={<CheckCircleIcon />}
            disabled
          >
            {t('challenges.completed')}
          </Button>
        ) : hasJoined() ? (
          <Button 
            fullWidth 
            variant="contained" 
            color="primary" 
            onClick={checkCompletion}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('challenges.checkCompletion')
            )}
          </Button>
        ) : (
          <Button 
            fullWidth 
            variant="outlined" 
            color="primary" 
            onClick={joinChallenge}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('challenges.join')
            )}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default DailyChallengeCard; 