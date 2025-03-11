import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Alert,
  Tooltip,
  Container
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
  Category as OtherIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  EmojiEvents as TrophyIcon,
  Group as GroupIcon,
  Leaderboard as LeaderboardIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { HabitContext } from '../context/HabitContext';
import { AuthContext } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import HabitEditModal from '../components/HabitEditModal';
import { useTranslation } from 'react-i18next';
import AddHabitModal from '../components/AddHabitModal';
import HabitCard from '../components/HabitCard';
import NegativeHabitCard from '../components/NegativeHabitCard';
import DailyChallengeCard from '../components/DailyChallengeCard';
import StatsCard from '../components/StatsCard';
import FilterMenu from '../components/FilterMenu';
import axios from 'axios';
import { API_URL } from '../config';

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
  const { habits, loading, error, completeHabit, deleteHabit, stats, getPositiveHabits, getNegativeHabits, getHabitsByCategory } = useContext(HabitContext);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [addHabitOpen, setAddHabitOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleHabitClick = (habitId) => {
    navigate(`/habits/${habitId}`);
  };
  
  const handleCompleteHabit = async (e, habitId) => {
    e.stopPropagation();
    const result = await completeHabit(habitId);
    // Если привычка успешно выполнена (true) или уже выполнена ('already_completed'),
    // не делаем переход на другую страницу
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
  
  // Функция для загрузки ежедневных испытаний
  const fetchDailyChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const response = await axios.get(`${API_URL}/api/challenges/daily`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setDailyChallenges(response.data || []);
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };
  
  // Загружаем ежедневные испытания при монтировании компонента
  useEffect(() => {
    if (token) {
      fetchDailyChallenges();
    }
  }, [token]);
  
  // Функция для открытия модального окна добавления привычки
  const handleOpenAddModal = () => {
    setHabitToEdit(null);
    setAddHabitOpen(true);
  };
  
  // Функция для закрытия модального окна добавления привычки
  const handleCloseAddModal = () => {
    setAddHabitOpen(false);
    setHabitToEdit(null);
  };
  
  // Функция для открытия меню фильтров
  const handleOpenFilterMenu = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  // Функция для закрытия меню фильтров
  const handleCloseFilterMenu = () => {
    setFilterAnchorEl(null);
  };
  
  // Функция для изменения категории фильтра
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    handleCloseFilterMenu();
  };
  
  // Получаем отфильтрованные привычки
  const getFilteredHabits = () => {
    // Сначала получаем привычки в зависимости от активной вкладки
    let filteredHabits = [];
    
    if (tabValue === 0) { // Все привычки
      filteredHabits = habits;
    } else if (tabValue === 1) { // Позитивные привычки
      filteredHabits = getPositiveHabits();
    } else if (tabValue === 2) { // Негативные привычки
      filteredHabits = getNegativeHabits();
    }
    
    // Затем фильтруем по категории, если выбрана конкретная категория
    if (selectedCategory !== 'all') {
      filteredHabits = filteredHabits.filter(habit => habit.category === selectedCategory);
    }
    
    return filteredHabits;
  };
  
  // Получаем отфильтрованные привычки
  const filteredHabitsByCategory = getFilteredHabits();
  
  // Проверяем, есть ли привычки для отображения
  const hasHabits = habits && habits.length > 0;
  const hasPositiveHabits = getPositiveHabits().length > 0;
  const hasNegativeHabits = getNegativeHabits().length > 0;
  
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Заголовок и кнопка добавления */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {t('dashboard.title')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
            >
              {t('habits.addHabit')}
            </Button>
          </Box>
        </Grid>
        
        {/* Статистика */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title={t('dashboard.totalHabits')}
                value={stats.totalHabits}
                icon={<CheckIcon color="primary" />}
                color="primary.light"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title={t('dashboard.completedToday')}
                value={stats.completedToday}
                icon={<CheckIcon color="success" />}
                color="success.light"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title={t('dashboard.currentStreak')}
                value={stats.streak}
                icon={<FireIcon color="error" />}
                color="error.light"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title={t('dashboard.completionRate')}
                value={`${stats.completionRate}%`}
                icon={<LeaderboardIcon color="info" />}
                color="info.light"
              />
            </Grid>
          </Grid>
        </Grid>
        
        {/* Ежедневные испытания */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                {t('dashboard.dailyChallenges')}
              </Typography>
              <Button
                component={RouterLink}
                to="/challenges"
                variant="outlined"
                color="primary"
                endIcon={<TrophyIcon />}
              >
                {t('dashboard.viewAllChallenges')}
              </Button>
            </Box>
            
            {loadingChallenges ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : dailyChallenges.length > 0 ? (
              <Grid container spacing={3}>
                {dailyChallenges.slice(0, 3).map((challenge) => (
                  <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                    <DailyChallengeCard 
                      challenge={challenge} 
                      refreshChallenges={fetchDailyChallenges}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                {t('dashboard.noDailyChallenges')}
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Ссылки на группы и таблицу лидеров */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {t('dashboard.groups')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {t('dashboard.groupsDescription')}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    component={RouterLink}
                    to="/groups"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    {t('dashboard.exploreGroups')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LeaderboardIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {t('dashboard.leaderboard')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {t('dashboard.leaderboardDescription')}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    component={RouterLink}
                    to="/leaderboard"
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    {t('dashboard.viewLeaderboard')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Привычки */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                {t('dashboard.yourHabits')}
              </Typography>
              <Box>
                <Tooltip title={t('dashboard.filter')}>
                  <IconButton onClick={handleOpenFilterMenu}>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                <FilterMenu
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={handleCloseFilterMenu}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </Box>
            </Box>
            
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab 
                label={t('habits.all')} 
                disabled={!hasHabits}
              />
              <Tab 
                label={t('habits.positive')} 
                disabled={!hasPositiveHabits}
              />
              <Tab 
                label={t('habits.negative')} 
                disabled={!hasNegativeHabits}
              />
            </Tabs>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredHabitsByCategory.length > 0 ? (
              <Grid container spacing={3}>
                {filteredHabitsByCategory.map((habit) => (
                  <Grid item xs={12} sm={6} md={4} key={habit._id}>
                    {habit.isNegative ? (
                      <NegativeHabitCard 
                        habit={habit} 
                        onEdit={handleEditClick} 
                      />
                    ) : (
                      <HabitCard 
                        habit={habit} 
                        onEdit={handleEditClick} 
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {selectedCategory !== 'all' 
                    ? t('dashboard.noHabitsInCategory') 
                    : tabValue === 1 
                      ? t('dashboard.noPositiveHabits')
                      : tabValue === 2
                        ? t('dashboard.noNegativeHabits')
                        : t('dashboard.noHabits')}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddModal}
                  sx={{ mt: 2 }}
                >
                  {t('habits.addHabit')}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
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
        onClose={handleCloseAddModal}
      />
      
      {/* Add Habit Modal */}
      <AddHabitModal
        open={addHabitOpen}
        onClose={handleCloseAddModal}
        habit={habitToEdit}
      />
    </Container>
  );
};

export default Dashboard; 