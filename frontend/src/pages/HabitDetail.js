import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalFireDepartment as FireIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { HabitContext } from '../context/HabitContext';
import ConfirmDialog from '../components/ConfirmDialog';
import HabitEditModal from '../components/HabitEditModal';
import { useTranslation } from 'react-i18next';

const HabitDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getHabit, completeHabit, deleteHabit } = useContext(HabitContext);
  
  const [habit, setHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchHabit = async () => {
      try {
        setLoading(true);
        const data = await getHabit(id);
        if (data) {
          setHabit(data);
        } else {
          setError(t('errors.notFound'));
        }
      } catch (err) {
        setError(t('errors.serverError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchHabit();
  }, [id, getHabit, t]);
  
  const handleBack = () => {
    navigate('/');
  };
  
  const handleComplete = async () => {
    if (habit.isCompletedToday) return;
    
    const success = await completeHabit(id);
    if (success) {
      setHabit(prevHabit => ({
        ...prevHabit,
        isCompletedToday: true,
        streak: prevHabit.streak + 1,
        completions: [
          ...prevHabit.completions,
          { date: new Date(), completed: true }
        ]
      }));
    }
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    const success = await deleteHabit(id);
    if (success) {
      navigate('/');
    }
    setDeleteDialogOpen(false);
  };
  
  const handleEdit = () => {
    setEditModalOpen(true);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !habit) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || t('errors.notFound')}
      </Alert>
    );
  }
  
  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Box className="fade-in">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {habit.title}
        </Typography>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={habit.difficulty}
                size="small"
                className={`badge-${habit.difficulty}`}
              />
              <Chip
                label={habit.category}
                size="small"
                className={`badge-${habit.category}`}
              />
            </Box>
            
            <Chip
              icon={<FireIcon />}
              label={`${t('habits.streak')}: ${habit.streak}`}
              color="secondary"
            />
          </Box>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            {habit.description || t('habits.noDescription')}
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary">
            {t('habits.frequency')}:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {habit.frequency === 'daily'
              ? t('habits.daily')
              : habit.frequency === 'weekly'
              ? t('habits.weekly')
              : t('habits.custom')}
          </Typography>
          
          {habit.frequency === 'custom' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('habits.selectDays')}:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {habit.customDays.map(day => (
                  <Chip 
                    key={day} 
                    label={day.charAt(0).toUpperCase() + day.slice(1)} 
                    size="small" 
                  />
                ))}
              </Box>
            </Box>
          )}
          
          <Typography variant="subtitle2" color="text.secondary">
            {t('habits.reward')}:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {habit.experiencePoints} XP и {habit.coinsReward} монет
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary">
            {t('habits.created')}:
          </Typography>
          <Typography variant="body2">
            {formatDate(habit.createdAt)}
          </Typography>
        </CardContent>
        
        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            onClick={handleComplete}
            disabled={habit.isCompletedToday}
          >
            {habit.isCompletedToday ? t('habits.completed') : t('habits.complete')}
          </Button>
          
          <Box>
            <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>
      
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        {t('habits.habitHistory')}
      </Typography>
      
      {habit.completions && habit.completions.length > 0 ? (
        <Grid container spacing={2}>
          {habit.completions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((completion, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="body1">
                      {formatDate(completion.date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('habits.completed')}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
        </Grid>
      ) : (
        <Alert severity="info">
          {t('habits.noHistory')}
        </Alert>
      )}
      
      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Удалить привычку"
        content={`Вы уверены, что хотите удалить привычку "${habit.title}"? Это действие нельзя отменить.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
      
      {/* Модальное окно редактирования */}
      {editModalOpen && (
        <HabitEditModal
          open={editModalOpen}
          habit={habit}
          onClose={() => {
            setEditModalOpen(false);
            // Обновляем данные привычки после редактирования
            getHabit(id).then(data => {
              if (data) setHabit(data);
            });
          }}
        />
      )}
    </Box>
  );
};

export default HabitDetail; 