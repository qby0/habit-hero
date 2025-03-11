import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  Whatshot as FireIcon,
  Category as CategoryIcon,
  Public as GlobalIcon,
  DateRange as WeeklyIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import LeaderboardTable from '../components/LeaderboardTable';
import PageHeader from '../components/PageHeader';

const Leaderboard = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState([]);
  const [categoryLeaderboard, setCategoryLeaderboard] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('fitness');
  const [refreshing, setRefreshing] = useState(false);
  
  // Функция для загрузки данных лидерборда
  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем глобальный лидерборд
      const globalResponse = await axios.get(`${API_URL}/api/leaderboard/global`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setGlobalLeaderboard(globalResponse.data || []);
      
      // Загружаем недельный лидерборд
      const weeklyResponse = await axios.get(`${API_URL}/api/leaderboard/weekly`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setWeeklyLeaderboard(weeklyResponse.data || []);
      
      // Загружаем лидерборд по стрикам
      const streakResponse = await axios.get(`${API_URL}/api/leaderboard/streak`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setStreakLeaderboard(streakResponse.data || []);
      
      // Загружаем лидерборд по категории
      await fetchCategoryLeaderboard(selectedCategory);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError(t('errors.fetchLeaderboard'));
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для загрузки лидерборда по категории
  const fetchCategoryLeaderboard = async (category) => {
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/category/${category}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCategoryLeaderboard(response.data || []);
    } catch (error) {
      console.error(`Error fetching ${category} leaderboard:`, error);
      setError(t('errors.fetchCategoryLeaderboard'));
    }
  };
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchLeaderboardData();
  }, [token]);
  
  // Функция для обновления данных лидерборда
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboardData();
    setRefreshing(false);
  };
  
  // Функция для обработки изменения вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Функция для обработки изменения категории
  const handleCategoryChange = async (event) => {
    const category = event.target.value;
    setSelectedCategory(category);
    
    setLoading(true);
    await fetchCategoryLeaderboard(category);
    setLoading(false);
  };
  
  // Рендерим содержимое в зависимости от активной вкладки
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Global
        return (
          <Box sx={{ mt: 3 }}>
            <LeaderboardTable data={globalLeaderboard} type="global" />
          </Box>
        );
      
      case 1: // Weekly
        return (
          <Box sx={{ mt: 3 }}>
            <LeaderboardTable data={weeklyLeaderboard} type="weekly" />
          </Box>
        );
      
      case 2: // Streak
        return (
          <Box sx={{ mt: 3 }}>
            <LeaderboardTable data={streakLeaderboard} type="streak" />
          </Box>
        );
      
      case 3: // Category
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>{t('leaderboard.selectCategory')}</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label={t('leaderboard.selectCategory')}
                >
                  <MenuItem value="fitness">{t('habits.categories.fitness')}</MenuItem>
                  <MenuItem value="health">{t('habits.categories.health')}</MenuItem>
                  <MenuItem value="productivity">{t('habits.categories.productivity')}</MenuItem>
                  <MenuItem value="education">{t('habits.categories.education')}</MenuItem>
                  <MenuItem value="finance">{t('habits.categories.finance')}</MenuItem>
                  <MenuItem value="social">{t('habits.categories.social')}</MenuItem>
                  <MenuItem value="mindfulness">{t('habits.categories.mindfulness')}</MenuItem>
                  <MenuItem value="other">{t('habits.categories.other')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <LeaderboardTable data={categoryLeaderboard} type="category" />
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader 
        title={t('leaderboard.title')}
        icon={<TrophyIcon fontSize="large" />}
        description={t('leaderboard.description')}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? t('leaderboard.refreshing') : t('leaderboard.refresh')}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={t('leaderboard.global')} 
            icon={<GlobalIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('leaderboard.weekly')} 
            icon={<WeeklyIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('leaderboard.streak')} 
            icon={<FireIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('leaderboard.byCategory')} 
            icon={<CategoryIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTabContent()
      )}
    </Container>
  );
};

export default Leaderboard; 