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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Habit</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Habit Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            fullWidth
            label="Description (Optional)"
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
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  label="Difficulty"
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
                        {difficulty.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Frequency</InputLabel>
            <Select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              label="Frequency"
            >
              {frequencies.map((frequency) => (
                <MenuItem key={frequency.value} value={frequency.value}>
                  {frequency.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {formData.frequency === 'custom' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Select days:
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
          
          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={handleSwitchChange}
                  name="active"
                  color="primary"
                />
              }
              label="Active"
            />
            <Typography variant="body2" color="text.secondary">
              {formData.active
                ? 'This habit is active and will appear in your dashboard.'
                : 'This habit is archived and will not appear in your active habits.'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HabitEditModal; 