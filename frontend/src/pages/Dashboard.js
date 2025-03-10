import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Divider,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalFireDepartment as FireIcon,
  FitnessCenter as HealthIcon,
  Work as ProductivityIcon,
  People as RelationshipsIcon,
  School as LearningIcon,
  Category as OtherIcon
} from '@mui/icons-material';
import { HabitContext } from '../context/HabitContext';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import HabitEditModal from '../components/HabitEditModal';
import { useTranslation } from 'react-i18next';

// Category icons mapping
const categoryIcons = {
  health: <HealthIcon />,
  productivity: <ProductivityIcon />,
  relationships: <RelationshipsIcon />,
  learning: <LearningIcon />,
  other: <OtherIcon />
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { habits, loading, error, completeHabit, deleteHabit } = useContext(HabitContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleHabitClick = (habitId) => {
    navigate(`/habits/${habitId}`);
  };
  
  const handleCompleteHabit = async (e, habitId) => {
    e.stopPropagation();
    await completeHabit(habitId);
  };
  
  const handleEditClick = (e, habit) => {
    e.stopPropagation();
    setHabitToEdit(habit);
    setEditModalOpen(true);
  };
  
  const handleDeleteClick = (e, habit) => {
    e.stopPropagation();
    setHabitToDelete(habit);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (habitToDelete) {
      await deleteHabit(habitToDelete._id);
      setDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };
  
  // Filter habits based on tab
  const filteredHabits = habits.filter(habit => {
    if (tabValue === 0) return habit.active; // Active habits
    if (tabValue === 1) return !habit.active; // Archived habits
    if (tabValue === 2) return habit.isCompletedToday; // Completed today
    return true;
  });
  
  // Group habits by category
  const habitsByCategory = filteredHabits.reduce((acc, habit) => {
    if (!acc[habit.category]) {
      acc[habit.category] = [];
    }
    acc[habit.category].push(habit);
    return acc;
  }, {});
  
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('dashboard.yourHabits')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip
            icon={<FireIcon />}
            label={`${user?.streak || 0} ${t('habits.dayStreak')}`}
            color="secondary"
            sx={{ mr: 2 }}
          />
        </Box>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={t('dashboard.active')} />
          <Tab label={t('dashboard.archived')} />
          <Tab label={t('dashboard.completedToday')} />
        </Tabs>
      </Paper>
      
      {filteredHabits.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {tabValue === 0
              ? t('dashboard.noHabits')
              : tabValue === 1
              ? t('dashboard.noArchivedHabits')
              : t('dashboard.noCompletedHabits')}
          </Typography>
          {tabValue === 0 && (
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => document.getElementById('add-habit-button')?.click()}
            >
              {t('dashboard.addFirstHabit')}
            </Button>
          )}
        </Box>
      ) : (
        Object.entries(habitsByCategory).map(([category, categoryHabits]) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ mr: 1, color: 'text.secondary' }}>
                {categoryIcons[category]}
              </Box>
              <Typography variant="h6" component="h2">
                {t(`habits.categories.${category}`)}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {categoryHabits.map(habit => (
                <Grid item xs={12} sm={6} md={4} key={habit._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      position: 'relative',
                      opacity: habit.isCompletedToday ? 0.8 : 1
                    }}
                    onClick={() => handleHabitClick(habit._id)}
                  >
                    {habit.isCompletedToday && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          bgcolor: 'success.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}
                      >
                        <CheckIcon fontSize="small" />
                      </Box>
                    )}
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {habit.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {habit.description || t('habits.noDescription')}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip
                          label={t(`habits.difficulties.${habit.difficulty}`)}
                          size="small"
                          className={`badge-${habit.difficulty}`}
                        />
                        
                        <Chip
                          icon={<FireIcon fontSize="small" />}
                          label={`${habit.streak} ${t('habits.streak')}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {habit.frequency === 'daily'
                            ? t('habits.daily')
                            : habit.frequency === 'weekly'
                            ? t('habits.weekly')
                            : t('habits.custom')}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<CheckIcon />}
                        onClick={(e) => handleCompleteHabit(e, habit._id)}
                        disabled={habit.isCompletedToday}
                      >
                        {habit.isCompletedToday ? t('habits.completed') : t('habits.complete')}
                      </Button>
                      
                      <Box sx={{ ml: 'auto', display: 'flex' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleEditClick(e, habit)}
                          aria-label={t('habits.edit')}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteClick(e, habit)}
                          aria-label={t('habits.delete')}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={t('habits.delete')}
        content={t('habits.confirmDelete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
      
      {/* Edit Habit Modal */}
      <HabitEditModal
        open={editModalOpen}
        habit={habitToEdit}
        onClose={() => setEditModalOpen(false)}
      />
    </Box>
  );
};

export default Dashboard; 