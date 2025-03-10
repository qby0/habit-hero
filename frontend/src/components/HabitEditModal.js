import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Chip,
  Typography,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import { HabitContext } from '../context/HabitContext';
import { useTranslation } from 'react-i18next';

const categories = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' }
];

const difficulties = [
  { value: 'easy', label: 'Easy (5 XP)', color: '#1976d2' },
  { value: 'medium', label: 'Medium (10 XP)', color: '#e65100' },
  { value: 'hard', label: 'Hard (15 XP)', color: '#c62828' }
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom Days' }
];

const weekdays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const HabitEditModal = ({ open, habit, onClose }) => {
  const { t } = useTranslation();
  const { updateHabit } = useContext(HabitContext);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    frequency: 'daily',
    customDays: [],
    difficulty: 'medium',
    active: true
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Initialize form data when habit changes
  useEffect(() => {
    if (habit) {
      setFormData({
        title: habit.title || '',
        description: habit.description || '',
        category: habit.category || 'other',
        frequency: habit.frequency || 'daily',
        customDays: habit.customDays || [],
        difficulty: habit.difficulty || 'medium',
        active: habit.active !== undefined ? habit.active : true
      });
    }
  }, [habit]);
  
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
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleCustomDayToggle = (day) => {
    const currentDays = [...formData.customDays];
    const dayIndex = currentDays.indexOf(day);
    
    if (dayIndex === -1) {
      currentDays.push(day);
    } else {
      currentDays.splice(dayIndex, 1);
    }
    
    setFormData({
      ...formData,
      customDays: currentDays
    });
    
    // Clear error when field is changed
    if (errors.customDays) {
      setErrors({
        ...errors,
        customDays: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.frequency === 'custom' && formData.customDays.length === 0) {
      newErrors.customDays = 'Please select at least one day';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    const success = await updateHabit(habit._id, formData);
    
    if (success) {
      handleClose();
    }
    
    setLoading(false);
  };
  
  const handleClose = () => {
    setErrors({});
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {habit ? t('habits.edit') : t('dashboard.addHabit')}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            label={t('habits.title')}
            name="title"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            error={!!errors.title}
            helperText={errors.title}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            label={t('habits.description')}
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth error={!!errors.category}>
            <InputLabel id="category-label">{t('habits.category')}</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={formData.category}
              onChange={handleChange}
              label={t('habits.category')}
            >
              {categories.map(category => (
                <MenuItem key={category.value} value={category.value}>
                  {t(`habits.categories.${category.value}`)}
                </MenuItem>
              ))}
            </Select>
            {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth error={!!errors.difficulty}>
            <InputLabel id="difficulty-label">{t('habits.difficulty')}</InputLabel>
            <Select
              labelId="difficulty-label"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              label={t('habits.difficulty')}
            >
              {difficulties.map(difficulty => (
                <MenuItem key={difficulty.value} value={difficulty.value}>
                  {t(`habits.difficulties.${difficulty.value}`)} ({difficulty.value === 'easy' ? '5' : difficulty.value === 'medium' ? '10' : '15'} XP)
                </MenuItem>
              ))}
            </Select>
            {errors.difficulty && <FormHelperText>{errors.difficulty}</FormHelperText>}
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth error={!!errors.frequency}>
            <InputLabel id="frequency-label">{t('habits.frequency')}</InputLabel>
            <Select
              labelId="frequency-label"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              label={t('habits.frequency')}
            >
              {frequencies.map(frequency => (
                <MenuItem key={frequency.value} value={frequency.value}>
                  {t(`habits.${frequency.value}`)}
                </MenuItem>
              ))}
            </Select>
            {errors.frequency && <FormHelperText>{errors.frequency}</FormHelperText>}
          </FormControl>
        </Box>
        
        {formData.frequency === 'custom' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('habits.selectDays')}
            </Typography>
            <Grid container spacing={1}>
              {weekdays.map(day => (
                <Grid item key={day.value}>
                  <Chip
                    label={day.label}
                    onClick={() => handleCustomDayToggle(day.value)}
                    color={formData.customDays.includes(day.value) ? 'primary' : 'default'}
                    variant={formData.customDays.includes(day.value) ? 'filled' : 'outlined'}
                  />
                </Grid>
              ))}
            </Grid>
            {errors.customDays && (
              <FormHelperText error>{errors.customDays}</FormHelperText>
            )}
          </Box>
        )}
        
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={handleSwitchChange}
                name="active"
                color="primary"
              />
            }
            label={t('dashboard.active')}
          />
          <Typography variant="body2" color="text.secondary">
            {formData.active
              ? t('habits.activeHabitInfo')
              : t('habits.archivedHabitInfo')}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          {t('habits.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
        >
          {loading ? t('profile.saving') : (habit ? t('habits.save') : t('dashboard.addHabit'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HabitEditModal; 