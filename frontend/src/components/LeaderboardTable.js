import React, { useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Whatshot as FireIcon,
  Star as StarIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';

// Компонент для отображения медали в зависимости от позиции
const PositionBadge = ({ position }) => {
  if (position === 1) {
    return (
      <Tooltip title="1st Place">
        <TrophyIcon sx={{ color: '#FFD700' }} /> {/* Gold */}
      </Tooltip>
    );
  } else if (position === 2) {
    return (
      <Tooltip title="2nd Place">
        <TrophyIcon sx={{ color: '#C0C0C0' }} /> {/* Silver */}
      </Tooltip>
    );
  } else if (position === 3) {
    return (
      <Tooltip title="3rd Place">
        <TrophyIcon sx={{ color: '#CD7F32' }} /> {/* Bronze */}
      </Tooltip>
    );
  } else {
    return <Typography variant="body2">{position}</Typography>;
  }
};

const LeaderboardTable = ({ data, type = 'global' }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  
  // Функция для определения, является ли строка текущим пользователем
  const isCurrentUser = (userId) => {
    return user && user._id === userId;
  };
  
  // Функция для форматирования даты последней активности
  const formatLastActive = (dateString) => {
    if (!dateString) return t('leaderboard.never');
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return t('leaderboard.today');
    } else if (diffDays === 1) {
      return t('leaderboard.yesterday');
    } else {
      return t('leaderboard.daysAgo', { days: diffDays });
    }
  };
  
  // Определяем заголовки таблицы в зависимости от типа лидерборда
  const getTableHeaders = () => {
    const commonHeaders = [
      { id: 'position', label: '#' },
      { id: 'user', label: t('leaderboard.user') }
    ];
    
    switch (type) {
      case 'global':
        return [
          ...commonHeaders,
          { id: 'xp', label: t('leaderboard.xp') },
          { id: 'level', label: t('leaderboard.level') },
          { id: 'completedHabits', label: t('leaderboard.completedHabits') },
          { id: 'lastActive', label: t('leaderboard.lastActive') }
        ];
      case 'weekly':
        return [
          ...commonHeaders,
          { id: 'weeklyXp', label: t('leaderboard.weeklyXp') },
          { id: 'weeklyCompletions', label: t('leaderboard.weeklyCompletions') },
          { id: 'streak', label: t('leaderboard.currentStreak') }
        ];
      case 'streak':
        return [
          ...commonHeaders,
          { id: 'longestStreak', label: t('leaderboard.longestStreak') },
          { id: 'currentStreak', label: t('leaderboard.currentStreak') },
          { id: 'totalDays', label: t('leaderboard.totalDays') }
        ];
      case 'category':
        return [
          ...commonHeaders,
          { id: 'categoryXp', label: t('leaderboard.categoryXp') },
          { id: 'categoryCompletions', label: t('leaderboard.categoryCompletions') },
          { id: 'categoryStreak', label: t('leaderboard.categoryStreak') }
        ];
      default:
        return commonHeaders;
    }
  };
  
  // Получаем максимальное значение для прогресс-бара
  const getMaxValue = (field) => {
    if (!data || data.length === 0) return 100;
    
    let maxVal = 0;
    data.forEach(item => {
      const value = getFieldValue(item, field);
      if (value > maxVal) maxVal = value;
    });
    
    return maxVal === 0 ? 100 : maxVal;
  };
  
  // Получаем значение поля в зависимости от типа лидерборда
  const getFieldValue = (item, field) => {
    switch (field) {
      case 'xp':
        return item.xp || 0;
      case 'weeklyXp':
        return item.weeklyXp || 0;
      case 'longestStreak':
        return item.longestStreak || 0;
      case 'categoryXp':
        return item.categoryXp || 0;
      case 'completedHabits':
        return item.completedHabits || 0;
      case 'weeklyCompletions':
        return item.weeklyCompletions || 0;
      case 'currentStreak':
      case 'streak':
        return item.currentStreak || 0;
      case 'totalDays':
        return item.totalDays || 0;
      case 'categoryCompletions':
        return item.categoryCompletions || 0;
      case 'categoryStreak':
        return item.categoryStreak || 0;
      default:
        return 0;
    }
  };
  
  // Получаем иконку для поля
  const getFieldIcon = (field) => {
    switch (field) {
      case 'xp':
      case 'weeklyXp':
      case 'categoryXp':
        return <StarIcon fontSize="small" sx={{ color: 'warning.main', mr: 0.5 }} />;
      case 'longestStreak':
      case 'currentStreak':
      case 'streak':
      case 'categoryStreak':
        return <FireIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />;
      case 'completedHabits':
      case 'weeklyCompletions':
      case 'categoryCompletions':
      case 'totalDays':
        return <BoltIcon fontSize="small" sx={{ color: 'info.main', mr: 0.5 }} />;
      default:
        return null;
    }
  };
  
  // Рендерим ячейку с прогресс-баром
  const renderProgressCell = (value, field) => {
    const maxValue = getMaxValue(field);
    const progress = (value / maxValue) * 100;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {getFieldIcon(field)}
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: field.includes('Streak') ? 'error.main' : 
                        field.includes('xp') || field.includes('Xp') ? 'warning.main' : 'info.main'
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{value}</Typography>
        </Box>
      </Box>
    );
  };
  
  const headers = getTableHeaders();
  
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
      <Table sx={{ minWidth: 650 }} aria-label="leaderboard table">
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.main' }}>
            {headers.map((header) => (
              <TableCell 
                key={header.id}
                align={header.id === 'position' || header.id === 'user' ? 'left' : 'center'}
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  py: 2
                }}
              >
                {header.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((row, index) => (
              <TableRow
                key={row._id || index}
                sx={{ 
                  '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                  bgcolor: isCurrentUser(row.userId) ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                {/* Позиция */}
                <TableCell component="th" scope="row" sx={{ width: '50px' }}>
                  <PositionBadge position={index + 1} />
                </TableCell>
                
                {/* Пользователь */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={row.avatar} 
                      alt={row.username}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    >
                      {row.username ? row.username.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: isCurrentUser(row.userId) ? 'bold' : 'normal' }}>
                        {row.username}
                        {isCurrentUser(row.userId) && (
                          <Chip 
                            label={t('leaderboard.you')} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                          />
                        )}
                      </Typography>
                      {row.title && (
                        <Typography variant="body2" color="text.secondary">
                          {row.title}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                {/* Динамические поля в зависимости от типа лидерборда */}
                {headers.slice(2).map((header) => {
                  if (header.id === 'lastActive') {
                    return (
                      <TableCell key={header.id} align="center">
                        <Typography variant="body2">
                          {formatLastActive(row.lastActive)}
                        </Typography>
                      </TableCell>
                    );
                  } else if (header.id === 'level') {
                    return (
                      <TableCell key={header.id} align="center">
                        <Chip 
                          label={`${t('leaderboard.level')} ${row.level || 1}`} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                    );
                  } else {
                    return (
                      <TableCell key={header.id} align="center">
                        {renderProgressCell(getFieldValue(row, header.id), header.id)}
                      </TableCell>
                    );
                  }
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('leaderboard.noData')}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LeaderboardTable; 