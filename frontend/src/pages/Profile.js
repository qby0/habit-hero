import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import UserProgress from '../components/UserProgress';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear success message
    if (success) {
      setSuccess(false);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать не менее 3 символов';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    const success = await updateProfile(formData);
    
    if (success) {
      setSuccess(true);
    }
    
    setLoading(false);
  };
  
  if (!user) {
    return (
      <Alert severity="error">Пользователь не найден</Alert>
    );
  }
  
  return (
    <Box className="fade-in">
      <Typography variant="h4" component="h1" gutterBottom>
        {t('profile.profile')}
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: '2.5rem',
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Typography variant="h5" sx={{ mb: 1 }}>
                {user?.username}
              </Typography>
              
              <UserProgress user={user} large />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              {t('profile.stats')}
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('profile.level')}
              </Typography>
              <Typography variant="body1">
                {user?.level || 1}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('profile.currentStreak')}
              </Typography>
              <Typography variant="body1">
                {user?.currentStreak || 0} {t('habits.streak')}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('profile.achievements')}
              </Typography>
              <Typography variant="body1">
                {user?.achievements?.length || 0}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t('profile.registrationDate')}
              </Typography>
              <Typography variant="body1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {t('profile.editProfile')}
              </Typography>
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {t('profile.updateSuccess')}
                </Alert>
              )}
              
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label={t('auth.username')}
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                  sx={{ mb: 3 }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label={t('auth.email')}
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{ mb: 3 }}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? t('profile.saving') : t('profile.saveChanges')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 