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
  TextField,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Group as GroupIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Public as PublicIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import GroupCard from '../components/GroupCard';
import PageHeader from '../components/PageHeader';

const Groups = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Состояние для диалога создания группы
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('general');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Функция для загрузки групп
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем группы пользователя
      const userGroupsResponse = await axios.get(`${API_URL}/api/groups/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserGroups(userGroupsResponse.data || []);
      
      // Загружаем публичные группы
      const publicGroupsResponse = await axios.get(`${API_URL}/api/groups/public`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          search: searchQuery
        }
      });
      
      setPublicGroups(publicGroupsResponse.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError(t('errors.fetchGroups'));
    } finally {
      setLoading(false);
    }
  };
  
  // Загружаем группы при монтировании компонента
  useEffect(() => {
    fetchGroups();
  }, [token]);
  
  // Функция для обновления списка групп
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };
  
  // Функция для обработки изменения вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Функция для обработки поиска
  const handleSearch = async () => {
    if (activeTab === 1) { // Только для публичных групп
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/groups/public`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            search: searchQuery
          }
        });
        
        setPublicGroups(response.data || []);
      } catch (error) {
        console.error('Error searching groups:', error);
        setError(t('errors.searchGroups'));
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Функция для обработки нажатия Enter в поле поиска
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Функция для открытия диалога создания группы
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };
  
  // Функция для закрытия диалога создания группы
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    // Сбрасываем значения полей
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupCategory('general');
    setNewGroupIsPrivate(false);
  };
  
  // Функция для создания новой группы
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      return;
    }
    
    setCreatingGroup(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/groups`,
        {
          name: newGroupName.trim(),
          description: newGroupDescription.trim(),
          category: newGroupCategory,
          isPrivate: newGroupIsPrivate
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Добавляем новую группу в список групп пользователя
      setUserGroups([...userGroups, response.data]);
      
      // Закрываем диалог
      handleCloseCreateDialog();
    } catch (error) {
      console.error('Error creating group:', error);
      setError(t('errors.createGroup'));
    } finally {
      setCreatingGroup(false);
    }
  };
  
  // Функция для обработки выхода из группы
  const handleLeaveGroup = (groupId) => {
    // Удаляем группу из списка групп пользователя
    setUserGroups(userGroups.filter(group => group._id !== groupId));
  };
  
  // Рендерим содержимое в зависимости от активной вкладки
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // My Groups
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
              >
                {t('groups.create')}
              </Button>
            </Box>
            
            {userGroups.length > 0 ? (
              <Grid container spacing={3}>
                {userGroups.map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group._id}>
                    <GroupCard 
                      group={group} 
                      onLeave={handleLeaveGroup}
                      refreshGroups={fetchGroups}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('groups.noGroups')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('groups.createOrJoinPrompt')}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                  sx={{ mt: 2 }}
                >
                  {t('groups.create')}
                </Button>
              </Paper>
            )}
          </Box>
        );
      
      case 1: // Public Groups
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <TextField
                placeholder={t('groups.search')}
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        {t('groups.search')}
                      </Button>
                    </InputAdornment>
                  )
                }}
                sx={{ flexGrow: 1, maxWidth: 500 }}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
              >
                {t('groups.create')}
              </Button>
            </Box>
            
            {publicGroups.length > 0 ? (
              <Grid container spacing={3}>
                {publicGroups.map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group._id}>
                    <GroupCard 
                      group={group} 
                      refreshGroups={fetchGroups}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('groups.noPublicGroups')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('groups.createGroupPrompt')}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                  sx={{ mt: 2 }}
                >
                  {t('groups.create')}
                </Button>
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
        title={t('groups.title')}
        icon={<GroupIcon fontSize="large" />}
        description={t('groups.description')}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? t('groups.refreshing') : t('groups.refresh')}
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
            label={t('groups.myGroups')} 
            icon={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <GroupIcon />
                {userGroups.length > 0 && (
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
                    {userGroups.length}
                  </Box>
                )}
              </Box>
            } 
            iconPosition="start"
          />
          <Tab 
            label={t('groups.publicGroups')} 
            icon={<PublicIcon />} 
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
      
      {/* Диалог создания группы */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('groups.createNew')}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {t('groups.createDescription')}
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label={t('groups.name')}
            type="text"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label={t('groups.description')}
            type="text"
            fullWidth
            variant="outlined"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>{t('groups.category')}</InputLabel>
            <Select
              value={newGroupCategory}
              onChange={(e) => setNewGroupCategory(e.target.value)}
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
          
          <FormControlLabel
            control={
              <Switch
                checked={newGroupIsPrivate}
                onChange={(e) => setNewGroupIsPrivate(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {newGroupIsPrivate ? (
                  <LockIcon fontSize="small" sx={{ mr: 1 }} />
                ) : (
                  <PublicIcon fontSize="small" sx={{ mr: 1 }} />
                )}
                {newGroupIsPrivate ? t('groups.private') : t('groups.public')}
              </Box>
            }
          />
          
          {newGroupIsPrivate && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('groups.privateDescription')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color="inherit">
            {t('groups.cancel')}
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            color="primary" 
            variant="contained"
            disabled={!newGroupName.trim() || creatingGroup}
          >
            {creatingGroup ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('groups.create')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Groups; 