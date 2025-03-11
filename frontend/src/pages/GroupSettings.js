import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import PageHeader from '../components/PageHeader';

const GroupSettings = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Состояние формы
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Функция для загрузки данных группы
  const fetchGroupData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/api/groups/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const groupData = response.data;
      setGroup(groupData);
      
      // Проверяем, является ли пользователь администратором группы
      if (groupData.admin !== user._id) {
        setError(t('errors.notGroupAdmin'));
        return;
      }
      
      // Заполняем форму данными группы
      setName(groupData.name || '');
      setDescription(groupData.description || '');
      setCategory(groupData.category || 'general');
      setIsPrivate(groupData.isPrivate || false);
    } catch (error) {
      console.error('Error fetching group data:', error);
      setError(t('errors.fetchGroupDetails'));
    } finally {
      setLoading(false);
    }
  };
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchGroupData();
  }, [id, token]);
  
  // Функция для сохранения настроек группы
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(t('errors.groupNameRequired'));
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      await axios.put(
        `${API_URL}/api/groups/${id}/settings`,
        {
          name: name.trim(),
          description: description.trim(),
          category,
          isPrivate
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Перенаправляем на страницу группы
      navigate(`/groups/${id}`);
    } catch (error) {
      console.error('Error updating group settings:', error);
      setError(t('errors.updateGroupSettings'));
      setSaving(false);
    }
  };
  
  // Функция для открытия диалога удаления группы
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  // Функция для закрытия диалога удаления группы
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  // Функция для удаления группы
  const handleDeleteGroup = async () => {
    setDeleting(true);
    
    try {
      await axios.delete(`${API_URL}/api/groups/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Перенаправляем на страницу групп
      navigate('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      setError(t('errors.deleteGroup'));
      setDeleting(false);
      handleCloseDeleteDialog();
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error && error === t('errors.notGroupAdmin')) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/groups/${id}`)}
        >
          {t('groups.backToGroup')}
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/groups/${id}`)}
        >
          {t('groups.backToGroup')}
        </Button>
      </Box>
      
      <PageHeader 
        title={t('groups.settings')}
        icon={<GroupIcon fontSize="large" />}
        description={t('groups.settingsDescription')}
      />
      
      {error && error !== t('errors.notGroupAdmin') && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSaveSettings}>
          <Typography variant="h6" gutterBottom>
            {t('groups.basicInfo')}
          </Typography>
          
          <TextField
            fullWidth
            label={t('groups.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label={t('groups.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('groups.category')}</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label={t('groups.category')}
            >
              <MenuItem value="general">{t('groups.categories.general')}</MenuItem>
              <MenuItem value="fitness">{t('groups.categories.fitness')}</MenuItem>
              <MenuItem value="health">{t('groups.categories.health')}</MenuItem>
              <MenuItem value="productivity">{t('groups.categories.productivity')}</MenuItem>
              <MenuItem value="education">{t('groups.categories.education')}</MenuItem>
              <MenuItem value="finance">{t('groups.categories.finance')}</MenuItem>
              <MenuItem value="social">{t('groups.categories.social')}</MenuItem>
              <MenuItem value="other">{t('groups.categories.other')}</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isPrivate ? (
                    <LockIcon fontSize="small" sx={{ mr: 1 }} />
                  ) : (
                    <PublicIcon fontSize="small" sx={{ mr: 1 }} />
                  )}
                  {isPrivate ? t('groups.private') : t('groups.public')}
                </Box>
              }
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
              {isPrivate
                ? t('groups.privateDescription')
                : t('groups.publicDescription')}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? t('groups.saving') : t('groups.saveSettings')}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
        <Typography variant="h6" gutterBottom color="error">
          {t('groups.dangerZone')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('groups.deleteWarning')}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleOpenDeleteDialog}
          >
            {t('groups.deleteGroup')}
          </Button>
        </Box>
      </Paper>
      
      {/* Диалог подтверждения удаления группы */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>{t('groups.deleteGroup')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('groups.deleteConfirmation')}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
            {t('groups.deleteConfirmationWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            {t('groups.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteGroup} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('groups.confirmDelete')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroupSettings; 