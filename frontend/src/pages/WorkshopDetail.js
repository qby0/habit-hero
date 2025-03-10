import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Chip,
  Rating,
  Divider,
  Card,
  CardContent,
  Avatar,
  TextField,
  IconButton,
  useTheme
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HabitContext } from '../context/HabitContext';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';

const WorkshopDetail = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { publicHabit, getPublicHabit, loading, importHabit, rateHabit, commentHabit } = useContext(HabitContext);
  
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(-1);
  const [comment, setComment] = useState('');
  
  useEffect(() => {
    getPublicHabit(id);
  }, [getPublicHabit, id]);
  
  const handleImport = async () => {
    const success = await importHabit(id);
    if (success) {
      navigate('/');
    }
  };
  
  const handleRatingChange = async (event, newValue) => {
    if (newValue) {
      setUserRating(newValue);
      await rateHabit(id, newValue);
    }
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (comment.trim()) {
      await commentHabit(id, comment);
      setComment('');
    }
  };
  
  const handleBack = () => {
    navigate('/workshop');
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
  
  if (loading || !publicHabit) return <Loading />;
  
  const createdAt = new Date(publicHabit.createdAt);
  const isOwnHabit = publicHabit.user?._id === user?._id;
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        {t('workshop.backToWorkshop')}
      </Button>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Grid container justifyContent="space-between" alignItems="flex-start">
            <Grid item>
              <Typography variant="h4" component="h1" gutterBottom>
                {publicHabit.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {t('workshop.by')} {publicHabit.user?.username || 'Unknown'}
                </Typography>
                
                <Box sx={{ mx: 2, color: 'text.disabled' }}>•</Box>
                
                <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {format(createdAt, 'PPP')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  value={publicHabit.avgRating || 0}
                  precision={0.5}
                  readOnly
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({publicHabit.totalRatings || 0} {t('workshop.ratings')})
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <DownloadIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  {publicHabit.downloads || 0} {t('workshop.downloads')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Chip 
              label={t(`habits.categories.${publicHabit.category}`)}
              size="small"
              sx={{ 
                bgcolor: getCategoryColor(publicHabit.category),
                color: 'white'
              }}
            />
            
            <Chip 
              label={t(`habits.difficulties.${publicHabit.difficulty}`)}
              size="small"
              sx={{ 
                bgcolor: getDifficultyColor(publicHabit.difficulty),
                color: 'white'
              }}
            />
            
            <Chip 
              label={t(`habits.${publicHabit.frequency}`)}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('habits.description')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {publicHabit.description || t('habits.noDescription')}
        </Typography>
        
        {publicHabit.frequency === 'custom' && publicHabit.customDays.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('habits.selectDays')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <Chip
                  key={day}
                  label={day.charAt(0).toUpperCase() + day.slice(1)}
                  color={publicHabit.customDays.includes(day) ? 'primary' : 'default'}
                  variant={publicHabit.customDays.includes(day) ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleImport}
            disabled={isOwnHabit}
          >
            {isOwnHabit ? t('workshop.ownHabit') : t('workshop.importHabit')}
          </Button>
        </Box>
      </Paper>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('workshop.rateHabit')}
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Rating
                name="habit-rating"
                value={userRating}
                onChange={handleRatingChange}
                onChangeActive={(event, newHover) => {
                  setHover(newHover);
                }}
                size="large"
                emptyIcon={<StarBorderIcon fontSize="inherit" />}
              />
              {userRating !== null && (
                <Box sx={{ ml: 2 }}>{t('workshop.ratingLabels.' + (hover !== -1 ? hover : userRating))}</Box>
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" align="center">
              {t('workshop.ratingHelp')}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('workshop.comments')} ({publicHabit.comments?.length || 0})
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder={t('workshop.addComment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      type="submit" 
                      color="primary" 
                      disabled={!comment.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  )
                }}
              />
            </Box>
            
            {publicHabit.comments?.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                {t('workshop.noComments')}
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflow: 'auto', pr: 1 }}>
                {publicHabit.comments?.map((comment, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          {comment.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {comment.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2">{comment.text}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WorkshopDetail; 