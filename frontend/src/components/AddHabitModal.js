import React, { useState, useEffect, useContext } from 'react';
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
  FormControlLabel,
  Checkbox,
  Tooltip,
  Switch,
  Divider,
  IconButton,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Add as AddIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { HabitContext } from '../context/HabitContext';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';

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

const AddHabitModal = ({ open, onClose, habit }) => {
  const { t } = useTranslation();
  const { createHabit, updateHabit } = useContext(HabitContext);
  const [customDays, setCustomDays] = useState([]);
  const [isNegative, setIsNegative] = useState(false);
  const [triggers, setTriggers] = useState([]);
  const [triggerInput, setTriggerInput] = useState('');
  
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'health',
      difficulty: 'medium',
      frequency: 'daily',
      isNegative: false,
      abstainDifficulty: 'medium'
    }
  });
  
  const frequency = watch('frequency');
  
  useEffect(() => {
    if (habit) {
      setValue('title', habit.title || '');
      setValue('description', habit.description || '');
      setValue('category', habit.category || 'health');
      setValue('difficulty', habit.difficulty || 'medium');
      setValue('frequency', habit.frequency || 'daily');
      setValue('isNegative', habit.isNegative || false);
      setValue('abstainDifficulty', habit.abstainDifficulty || 'medium');
      
      setIsNegative(habit.isNegative || false);
      setCustomDays(habit.customDays || []);
      setTriggers(habit.triggers || []);
    }
  }, [habit, setValue]);
  
  const handleClose = () => {
    reset();
    setCustomDays([]);
    setIsNegative(false);
    setTriggers([]);
    setTriggerInput('');
    onClose();
  };
  
  const onSubmit = async (data) => {
    const habitData = {
      ...data,
      customDays: frequency === 'custom' ? customDays : [],
      isNegative,
      triggers: isNegative ? triggers : []
    };
    
    try {
      if (habit) {
        const result = await updateHabit(habit._id, habitData);
        if (result.success) {
          toast.success(t('habits.habitUpdated'));
          handleClose();
        } else {
          toast.error(result.message);
        }
      } else {
        const result = await createHabit(habitData);
        if (result.success) {
          toast.success(t('habits.habitCreated'));
          handleClose();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error(t('errors.serverError'));
    }
  };
  
  const handleDayToggle = (day) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day]);
    }
  };
  
  const handleHabitTypeChange = (event) => {
    setIsNegative(event.target.checked);
    setValue('isNegative', event.target.checked);
  };
  
  const handleAddTrigger = () => {
    if (triggerInput.trim() && !triggers.includes(triggerInput.trim())) {
      setTriggers([...triggers, triggerInput.trim()]);
      setTriggerInput('');
    }
  };
  
  const handleDeleteTrigger = (trigger) => {
    setTriggers(triggers.filter(t => t !== trigger));
  };
  
  const handleTriggerKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTrigger();
    }
  };
  
  const getDayButtonStyle = (day) => ({
    margin: '0 4px',
    padding: '4px 8px',
    minWidth: '36px',
    backgroundColor: customDays.includes(day) ? 'primary.main' : 'background.paper',
    color: customDays.includes(day) ? 'white' : 'text.primary',
    border: '1px solid',
    borderColor: customDays.includes(day) ? 'primary.main' : 'divider',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: customDays.includes(day) ? 'primary.dark' : 'action.hover',
    }
  });
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {habit ? t('habits.editHabit') : t('habits.addHabit')}
      </DialogTitle>
      
      <DialogContent>
        <form id="habit-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isNegative}
                    onChange={handleHabitTypeChange}
                    color={isNegative ? 'error' : 'primary'}
                  />
                }
                label={
                  <Typography color={isNegative ? 'error' : 'primary'}>
                    {isNegative ? t('habits.negativeHabit') : t('habits.positiveHabit')}
                  </Typography>
                }
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('habits.title')}
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title ? t('errors.requiredField') : ''}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('habits.description')}
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel>{t('habits.category')}</InputLabel>
                    <Select {...field} label={t('habits.category')}>
                      <MenuItem value="health">{t('habits.categories.health')}</MenuItem>
                      <MenuItem value="fitness">{t('habits.categories.fitness')}</MenuItem>
                      <MenuItem value="productivity">{t('habits.categories.productivity')}</MenuItem>
                      <MenuItem value="learning">{t('habits.categories.learning')}</MenuItem>
                      <MenuItem value="finance">{t('habits.categories.finance')}</MenuItem>
                      <MenuItem value="relationships">{t('habits.categories.relationships')}</MenuItem>
                      <MenuItem value="mindfulness">{t('habits.categories.mindfulness')}</MenuItem>
                      <MenuItem value="other">{t('habits.categories.other')}</MenuItem>
                    </Select>
                    {errors.category && <FormHelperText>{t('errors.requiredField')}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name={isNegative ? 'abstainDifficulty' : 'difficulty'}
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.difficulty || !!errors.abstainDifficulty}>
                    <InputLabel>
                      {isNegative ? t('habits.abstainDifficulty') : t('habits.difficulty')}
                    </InputLabel>
                    <Select 
                      {...field} 
                      label={isNegative ? t('habits.abstainDifficulty') : t('habits.difficulty')}
                    >
                      <MenuItem value="easy">{t('habits.difficulties.easy')}</MenuItem>
                      <MenuItem value="medium">{t('habits.difficulties.medium')}</MenuItem>
                      <MenuItem value="hard">{t('habits.difficulties.hard')}</MenuItem>
                    </Select>
                    {(errors.difficulty || errors.abstainDifficulty) && (
                      <FormHelperText>{t('errors.requiredField')}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            
            {!isNegative && (
              <Grid item xs={12}>
                <Controller
                  name="frequency"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.frequency}>
                      <InputLabel>{t('habits.frequency')}</InputLabel>
                      <Select {...field} label={t('habits.frequency')}>
                        <MenuItem value="daily">{t('habits.daily')}</MenuItem>
                        <MenuItem value="weekly">{t('habits.weekly')}</MenuItem>
                        <MenuItem value="custom">{t('habits.custom')}</MenuItem>
                      </Select>
                      {errors.frequency && <FormHelperText>{t('errors.requiredField')}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
            )}
            
            {!isNegative && frequency === 'custom' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('habits.selectDays')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {weekdays.map((day) => (
                    <Button
                      key={day.value}
                      variant={customDays.includes(day.value) ? 'contained' : 'outlined'}
                      color="primary"
                      onClick={() => handleDayToggle(day.value)}
                      sx={{ minWidth: 100 }}
                    >
                      {day.label}
                    </Button>
                  ))}
                </Box>
                {customDays.length === 0 && (
                  <FormHelperText error>{t('errors.selectAtLeastOneDay')}</FormHelperText>
                )}
              </Grid>
            )}
            
            {isNegative && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('habits.triggers')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    fullWidth
                    placeholder={t('habits.triggerPlaceholder')}
                    value={triggerInput}
                    onChange={(e) => setTriggerInput(e.target.value)}
                    onKeyPress={handleTriggerKeyPress}
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddTrigger}
                    disabled={!triggerInput.trim()}
                    startIcon={<AddIcon />}
                  >
                    {t('habits.addTrigger')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {triggers.map((trigger, index) => (
                    <Chip
                      key={index}
                      label={trigger}
                      onDelete={() => handleDeleteTrigger(trigger)}
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t('habits.cancel')}
        </Button>
        <Button 
          type="submit" 
          form="habit-form" 
          color="primary" 
          variant="contained"
          disabled={frequency === 'custom' && customDays.length === 0}
        >
          {habit ? t('habits.save') : t('habits.addHabit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddHabitModal; 