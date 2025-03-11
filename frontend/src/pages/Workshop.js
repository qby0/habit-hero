import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Rating,
  Chip,
  Divider,
  Paper,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HabitContext } from '../context/HabitContext';
import Loading from '../components/Loading';

const Workshop = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { publicHabits, getPublicHabits, loading, importHabit } = useContext(HabitContext);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Сохраняем предыдущие значения для проверки изменений
  const prevCategoryRef = useRef(category);
  const prevSortRef = useRef(sort);
  
  // Используем useCallback с мемоизацией зависимостей
  const fetchHabits = useCallback(async () => {
    setIsLoadingData(true);
    await getPublicHabits(sort, category, search);
    setIsLoadingData(false);
  }, [getPublicHabits, sort, category, search]);
  
  useEffect(() => {
    // Загружаем привычки только при первой загрузке страницы
    // или при изменении параметров sort, category или search
    const categoryChanged = prevCategoryRef.current !== category;
    const sortChanged = prevSortRef.current !== sort;
    
    if (categoryChanged || sortChanged) {
      fetchHabits();
      // Обновляем сохраненные значения
      prevCategoryRef.current = category;
      prevSortRef.current = sort;
    }
  }, [fetchHabits, category, sort]);
  
  // При первой загрузке компонента
  useEffect(() => {
    fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHabits();
  };
  
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setSort(e.target.value);
  };
  
  const handleImport = async (id) => {
    const success = await importHabit(id);
    if (success === true) {
      navigate('/');
    } else if (success === 'already_imported') {
      setAlertMessage(t('workshop.alreadyImported'));
      setShowAlert(true);
    }
  };
  
  const handleViewDetails = (id) => {
    navigate(`/workshop/${id}`);
  };
  
  const handleCloseAlert = () => {
    setShowAlert(false);
  };
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'health':
        return theme.palette.success.main;
      case 'productivity':
        return theme.palette.info.main;
      case 'relationships':
        return theme.palette.secondary.main;
      case 'learning':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#1976d2';
      case 'medium':
        return '#e65100';
      case 'hard':
        return '#c62828';
      default:
        return theme.palette.text.secondary;
    }
  };
  
  if (loading && !isLoadingData) return <Loading />;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="info" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('workshop.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('workshop.subtitle')}
        </Typography>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                placeholder={t('workshop.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button type="submit" variant="contained" size="small">
                        {t('workshop.searchButton')}
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </form>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                  {t('workshop.category')}
                </Box>
              </InputLabel>
              <Select
                value={category}
                onChange={handleCategoryChange}
                label={t('workshop.category')}
              >
                <MenuItem value="all">{t('workshop.allCategories')}</MenuItem>
                <MenuItem value="health">{t('habits.categories.health')}</MenuItem>
                <MenuItem value="productivity">{t('habits.categories.productivity')}</MenuItem>
                <MenuItem value="relationships">{t('habits.categories.relationships')}</MenuItem>
                <MenuItem value="learning">{t('habits.categories.learning')}</MenuItem>
                <MenuItem value="other">{t('habits.categories.other')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SortIcon fontSize="small" sx={{ mr: 1 }} />
                  {t('workshop.sortBy')}
                </Box>
              </InputLabel>
              <Select
                value={sort}
                onChange={handleSortChange}
                label={t('workshop.sortBy')}
              >
                <MenuItem value="newest">{t('workshop.newest')}</MenuItem>
                <MenuItem value="rating">{t('workshop.highestRated')}</MenuItem>
                <MenuItem value="popularity">{t('workshop.mostDownloaded')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {isLoadingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : publicHabits.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            {t('workshop.noHabits')}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {publicHabits.map((habit) => (
            <Grid item xs={12} sm={6} md={4} key={habit._id}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {habit.title}
                    </Typography>
                    <Chip 
                      label={t(`habits.difficulties.${habit.difficulty}`)}
                      size="small"
                      sx={{ 
                        bgcolor: getDifficultyColor(habit.difficulty),
                        color: 'white'
                      }}
                    />
                  </Box>
                  
                  <Chip 
                    label={t(`habits.categories.${habit.category}`)}
                    size="small"
                    sx={{ 
                      mb: 2,
                      bgcolor: getCategoryColor(habit.category),
                      color: 'white'
                    }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '3.6em'
                  }}>
                    {habit.description || t('habits.noDescription')}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating
                        value={habit.avgRating || 0}
                        precision={0.5}
                        readOnly
                        size="small"
                        emptyIcon={<StarIcon fontSize="inherit" />}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({habit.totalRatings || 0})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DownloadIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        {habit.downloads || 0}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    {t('workshop.by')} {habit.user?.username || 'Unknown'}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    onClick={() => handleViewDetails(habit._id)}
                    sx={{ mr: 1 }}
                  >
                    {t('workshop.details')}
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    startIcon={<DownloadIcon />}
                    onClick={() => handleImport(habit._id)}
                  >
                    {t('workshop.import')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Workshop;