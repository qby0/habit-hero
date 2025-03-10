import React, { useState, useContext } from 'react';
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
  Grid
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

const AddHabitModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { createHabit } = useContext(HabitContext);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    frequency: 'daily',
    customDays: [],
    difficulty: 'medium'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
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
      newErrors.title = t('errors.required');
    }
    
    if (formData.frequency === 'custom' && formData.customDays.length === 0) {
      newErrors.customDays = t('habits.selectDaysError');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    const success = await createHabit(formData);
    
    if (success) {
      handleClose();
    }
    
    setLoading(false);
  };
  
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'other',
      frequency: 'daily',
      customDays: [],
      difficulty: 'medium'
    });
    setErrors({});
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('dashboard.addHabit')}</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label={t('habits.title')}
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            variant="outlined"
            autoFocus
          />
          
          <TextField
            fullWidth
            label={t('habits.description')}
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            multiline
            rows={2}
          />
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('habits.category')}</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label={t('habits.category')}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {t(`habits.categories.${category.value}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('habits.difficulty')}</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  label={t('habits.difficulty')}
                >
                  {difficulties.map((difficulty) => (
                    <MenuItem key={difficulty.value} value={difficulty.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: difficulty.color,
                            mr: 1
                          }}
                        />
                        {t(`habits.difficulties.${difficulty.value}`)} ({difficulty.value === 'easy' ? '5' : difficulty.value === 'medium' ? '10' : '15'} XP)
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('habits.frequency')}</InputLabel>
            <Select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              label={t('habits.frequency')}
            >
              {frequencies.map((frequency) => (
                <MenuItem key={frequency.value} value={frequency.value}>
                  {t(`habits.${frequency.value}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {formData.frequency === 'custom' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('habits.selectDays')}:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {weekdays.map((day) => (
                  <Chip
                    key={day.value}
                    label={day.label}
                    onClick={() => handleCustomDayToggle(day.value)}
                    color={formData.customDays.includes(day.value) ? 'primary' : 'default'}
                    variant={formData.customDays.includes(day.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              
              {errors.customDays && (
                <FormHelperText error>{errors.customDays}</FormHelperText>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          {t('habits.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? t('profile.saving') : t('dashboard.addHabit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddHabitModal; 