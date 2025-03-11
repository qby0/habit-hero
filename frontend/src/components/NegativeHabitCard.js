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
  Tooltip,
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
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { HabitContext } from '../context/HabitContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NegativeHabitCard = ({ habit, onEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { markAbstained, markFailed, deleteHabit } = useContext(HabitContext);
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
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
  
  const handleAbstainClick = async () => {
    setLoading(true);
    try {
      const result = await markAbstained(habit._id);
      if (result.success) {
        toast.success(t('habits.abstainedMessage'));
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleFailClick = () => {
    setFailDialogOpen(true);
  };
  
  const handleFailConfirm = async () => {
    setLoading(true);
    try {
      const result = await markFailed(habit._id);
      if (result.success) {
        toast.info(t('habits.failedMessage'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
      setFailDialogOpen(false);
    }
  };
  
  // Проверяем, отмечена ли привычка сегодня
  const isMarkedToday = () => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) return false;
    
    const lastEntry = habit.completionHistory[habit.completionHistory.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entryDate = new Date(lastEntry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    return entryDate.getTime() === today.getTime();
  };
  
  // Определяем, был ли сегодня срыв
  const isFailedToday = () => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) return false;
    
    const lastEntry = habit.completionHistory[habit.completionHistory.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entryDate = new Date(lastEntry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    return entryDate.getTime() === today.getTime() && lastEntry.completed;
  };
  
  // Определяем, воздержался ли сегодня
  const isAbstainedToday = () => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) return false;
    
    const lastEntry = habit.completionHistory[habit.completionHistory.length - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entryDate = new Date(lastEntry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    return entryDate.getTime() === today.getTime() && !lastEntry.completed;
  };
  
  // Рассчитываем прогресс для визуализации
  const calculateProgress = () => {
    if (!habit.abstainDays || habit.abstainDays === 0) return 0;
    
    // Максимальный прогресс - 100% при 30 днях воздержания
    const maxDays = 30;
    return Math.min((habit.abstainDays / maxDays) * 100, 100);
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        borderLeft: '4px solid',
        borderColor: 'error.main',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
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
              {t('habits.abstainedDays')}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {habit.abstainDays || 0}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={calculateProgress()} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(239, 83, 80, 0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'success.main'
              }
            }}
          />
        </Box>
        
        {habit.triggers && habit.triggers.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('habits.triggers')}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {habit.triggers.map((trigger, index) => (
                <Chip 
                  key={index} 
                  label={trigger} 
                  size="small" 
                  variant="outlined"
                  color="error"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('habits.maxAbstainDays')}:
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {habit.maxAbstainDays || 0}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, pt: 1 }}>
        {isMarkedToday() ? (
          isAbstainedToday() ? (
            <Button 
              fullWidth 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleIcon />}
              disabled
            >
              {t('habits.abstained')}
            </Button>
          ) : (
            <Button 
              fullWidth 
              variant="contained" 
              color="error" 
              startIcon={<CancelIcon />}
              disabled
            >
              {t('habits.failed')}
            </Button>
          )
        ) : (
          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleIcon />}
              onClick={handleAbstainClick}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {t('habits.markAbstained')}
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<CancelIcon />}
              onClick={handleFailClick}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {t('habits.markFailed')}
            </Button>
          </Box>
        )}
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
      
      {/* Диалог подтверждения срыва */}
      <Dialog
        open={failDialogOpen}
        onClose={() => setFailDialogOpen(false)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          {t('habits.markFailed')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('habits.confirmFail')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFailDialogOpen(false)} color="inherit">
            {t('habits.cancel')}
          </Button>
          <Button onClick={handleFailConfirm} color="error" disabled={loading}>
            {t('habits.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default NegativeHabitCard; 