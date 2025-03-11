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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Whatshot as FireIcon
} from '@mui/icons-material';
import { HabitContext } from '../context/HabitContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const HabitCard = ({ habit, onEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { completeHabit, deleteHabit } = useContext(HabitContext);
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  
  const handleEditClick = () => {
    handleMenuClose();
    onEdit(habit);
  };
  
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await deleteHabit(habit._id);
      toast.success(t('habits.habitDeleted'));
    } catch (error) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleCompleteClick = async () => {
    setLoading(true);
    try {
      const result = await completeHabit(habit._id);
      if (result.success) {
        toast.success(t('habits.habitCompleted'));
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleCardClick = () => {
    navigate(`/habits/${habit._id}`);
  };
  
  // Проверяем, выполнена ли привычка сегодня
  const isCompletedToday = () => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) return false;
    
    const lastEntry = habit.completionHistory[habit.completionHistory.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entryDate = new Date(lastEntry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    return entryDate.getTime() === today.getTime() && lastEntry.completed;
  };
  
  // Рассчитываем прогресс для визуализации
  const calculateProgress = () => {
    if (!habit.streak) return 0;
    
    // Максимальный прогресс - 100% при 30 днях подряд
    const maxStreak = 30;
    return Math.min((habit.streak / maxStreak) * 100, 100);
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      {isCompletedToday() && (
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {habit.title}
          </Typography>
          
          <IconButton 
            size="small" 
            onClick={handleMenuOpen}
            aria-label="habit options"
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEditClick}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              {t('habits.edit')}
            </MenuItem>
            <MenuItem onClick={handleDeleteClick}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              {t('habits.delete')}
            </MenuItem>
          </Menu>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Chip 
            label={t(`habits.categories.${habit.category}`)} 
            size="small" 
            sx={{ mr: 1 }}
            className={`badge-${habit.category}`}
          />
          <Chip 
            label={t(`habits.difficulties.${habit.difficulty}`)} 
            size="small"
            className={`badge-${habit.difficulty}`}
          />
        </Box>
        
        {habit.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {habit.description}
          </Typography>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t('habits.streak')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FireIcon fontSize="small" sx={{ mr: 0.5, color: 'error.main' }} />
              <Typography variant="body2" fontWeight="bold">
                {habit.streak || 0}
              </Typography>
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={calculateProgress()} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'error.main'
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {habit.frequency === 'daily'
              ? t('habits.daily')
              : habit.frequency === 'weekly'
              ? t('habits.weekly')
              : t('habits.custom')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('habits.longestStreak')}: {habit.longestStreak || 0}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, pt: 1 }}>
        <Button 
          fullWidth 
          variant="contained" 
          color="primary" 
          startIcon={<CheckCircleIcon />}
          onClick={handleCompleteClick}
          disabled={isCompletedToday() || loading}
        >
          {isCompletedToday() ? t('habits.completed') : t('habits.complete')}
        </Button>
      </CardActions>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('habits.delete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('habits.confirmDelete')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            {t('habits.cancel')}
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={loading}>
            {t('habits.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default HabitCard; 