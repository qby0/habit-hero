import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import DailyChallengeCard from '../components/DailyChallengeCard';
import PageHeader from '../components/PageHeader';

const Challenges = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Функция для загрузки испытаний
  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/challenges`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { daily, active, available, completed } = response.data;
      
      setDailyChallenges(daily || []);
      setActiveChallenges(active || []);
      setAvailableChallenges(available || []);
      setCompletedChallenges(completed || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setError(t('errors.fetchChallenges'));
    } finally {
      setLoading(false);
    }
  };
  
  // Загружаем испытания при монтировании компонента
  useEffect(() => {
    fetchChallenges();
  }, [token]);
  
  // Функция для обновления списка испытаний
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChallenges();
    setRefreshing(false);
  };
  
  // Функция для обработки изменения вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Функция для обработки завершения испытания
  const handleChallengeComplete = (challengeId) => {
    // Обновляем списки испытаний
    const updatedAvailable = availableChallenges.filter(c => c._id !== challengeId);
    const updatedActive = activeChallenges.filter(c => c._id !== challengeId);
    const updatedDaily = dailyChallenges.filter(c => c._id !== challengeId);
    
    // Находим завершенное испытание
    const completedChallenge = 
      [...dailyChallenges, ...activeChallenges, ...availableChallenges]
      .find(c => c._id === challengeId);
    
    if (completedChallenge) {
      setCompletedChallenges([...completedChallenges, completedChallenge]);
    }
    
    setAvailableChallenges(updatedAvailable);
    setActiveChallenges(updatedActive);
    setDailyChallenges(updatedDaily);
  };
  
  // Рендерим содержимое в зависимости от активной вкладки
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Daily
        return (
          <Box sx={{ mt: 3 }}>
            {dailyChallenges.length > 0 ? (
              <Grid container spacing={3}>
                {dailyChallenges.map((challenge) => (
                  <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                    <DailyChallengeCard 
                      challenge={challenge} 
                      onComplete={handleChallengeComplete}
                      refreshChallenges={fetchChallenges}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('challenges.noDailyChallenges')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('challenges.checkBackLater')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 1: // Active
        return (
          <Box sx={{ mt: 3 }}>
            {activeChallenges.length > 0 ? (
              <Grid container spacing={3}>
                {activeChallenges.map((challenge) => (
                  <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                    <DailyChallengeCard 
                      challenge={challenge} 
                      onComplete={handleChallengeComplete}
                      refreshChallenges={fetchChallenges}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('challenges.noActiveChallenges')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('challenges.joinChallengePrompt')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 2: // Available
        return (
          <Box sx={{ mt: 3 }}>
            {availableChallenges.length > 0 ? (
              <Grid container spacing={3}>
                {availableChallenges.map((challenge) => (
                  <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                    <DailyChallengeCard 
                      challenge={challenge} 
                      onComplete={handleChallengeComplete}
                      refreshChallenges={fetchChallenges}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('challenges.noAvailableChallenges')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('challenges.checkBackLater')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 3: // Completed
        return (
          <Box sx={{ mt: 3 }}>
            {completedChallenges.length > 0 ? (
              <Grid container spacing={3}>
                {completedChallenges.map((challenge) => (
                  <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                    <DailyChallengeCard 
                      challenge={challenge} 
                      refreshChallenges={fetchChallenges}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('challenges.noCompletedChallenges')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('challenges.completePrompt')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader 
        title={t('challenges.title')}
        icon={<TrophyIcon fontSize="large" />}
        description={t('challenges.description')}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? t('challenges.refreshing') : t('challenges.refresh')}
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
            label={t('challenges.daily')} 
            icon={<TimeIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('challenges.active')} 
            icon={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <TrophyIcon />
                {activeChallenges.length > 0 && (
                  <Box 
                    component="span" 
                    sx={{ 
                      ml: 0.5, 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: 20, 
                      height: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}
                  >
                    {activeChallenges.length}
                  </Box>
                )}
              </Box>
            } 
            iconPosition="start"
          />
          <Tab 
            label={t('challenges.available')} 
            icon={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <TrophyIcon />
                {availableChallenges.length > 0 && (
                  <Box 
                    component="span" 
                    sx={{ 
                      ml: 0.5, 
                      bgcolor: 'primary.main', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: 20, 
                      height: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}
                  >
                    {availableChallenges.length}
                  </Box>
                )}
              </Box>
            } 
            iconPosition="start"
          />
          <Tab 
            label={t('challenges.completed')} 
            icon={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <TrophyIcon />
                {completedChallenges.length > 0 && (
                  <Box 
                    component="span" 
                    sx={{ 
                      ml: 0.5, 
                      bgcolor: 'success.main', 
                      color: 'white', 
                      borderRadius: '50%', 
                      width: 20, 
                      height: 20, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.75rem'
                    }}
                  >
                    {completedChallenges.length}
                  </Box>
                )}
              </Box>
            } 
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

export default Challenges; 