import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Divider,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tabs,
  Tab,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import {
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as LeaveIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import PageHeader from '../components/PageHeader';

const GroupDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(false);
  
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
      
      setGroup(response.data);
      
      // Если пользователь является администратором, загружаем запросы на вступление
      if (response.data.admin === user._id) {
        fetchMembershipRequests();
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      setError(t('errors.fetchGroupDetails'));
    } finally {
      setLoading(false);
    }
  };
  
  // Функция для загрузки запросов на вступление
  const fetchMembershipRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups/${id}/membership-requests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setMembershipRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching membership requests:', error);
    }
  };
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchGroupData();
  }, [id, token]);
  
  // Функция для обработки изменения вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Функция для отправки сообщения в группу
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSendingMessage(true);
    try {
      await axios.post(
        `${API_URL}/api/groups/${id}/activity`,
        { message: message.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Обновляем данные группы, чтобы отобразить новое сообщение
      fetchGroupData();
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('errors.sendMessage'));
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Функция для обработки нажатия Enter в поле сообщения
  const handleMessageKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  // Функция для обработки запроса на вступление
  const handleMembershipRequest = async (requestId, action) => {
    setProcessingRequest(true);
    try {
      await axios.post(
        `${API_URL}/api/groups/membership-requests`,
        { requestId, action },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Обновляем список запросов и данные группы
      fetchMembershipRequests();
      fetchGroupData();
    } catch (error) {
      console.error('Error processing membership request:', error);
      setError(t('errors.processMembershipRequest'));
    } finally {
      setProcessingRequest(false);
    }
  };
  
  // Функция для выхода из группы
  const handleLeaveGroup = async () => {
    if (window.confirm(t('groups.confirmLeave'))) {
      setLoading(true);
      try {
        await axios.post(
          `${API_URL}/api/groups/${id}/leave`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        navigate('/groups');
      } catch (error) {
        console.error('Error leaving group:', error);
        setError(t('errors.leaveGroup'));
        setLoading(false);
      }
    }
  };
  
  // Проверяем, является ли пользователь администратором группы
  const isAdmin = () => {
    return group && group.admin === user._id;
  };
  
  // Форматируем дату
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Рендерим содержимое в зависимости от активной вкладки
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Activity
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder={t('groups.writeMessage')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleMessageKeyPress}
                disabled={sendingMessage}
                InputProps={{
                  endAdornment: (
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<SendIcon />}
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendingMessage}
                      sx={{ ml: 1 }}
                    >
                      {t('groups.send')}
                    </Button>
                  )
                }}
              />
            </Box>
            
            {group && group.activity && group.activity.length > 0 ? (
              <List>
                {group.activity.map((item, index) => (
                  <React.Fragment key={item._id || index}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={item.user?.avatar} alt={item.user?.username}>
                          {item.user?.username?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" component="span">
                              {item.user?.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(item.date)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body1"
                            color="text.primary"
                            sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                          >
                            {item.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < group.activity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('groups.noActivity')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('groups.beFirstToPost')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 1: // Members
        return (
          <Box sx={{ mt: 3 }}>
            {group && group.memberDetails && group.memberDetails.length > 0 ? (
              <List>
                {group.memberDetails.map((member) => (
                  <ListItem key={member._id}>
                    <ListItemAvatar>
                      <Avatar src={member.avatar} alt={member.username}>
                        {member.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {member.username}
                          {member._id === group.admin && (
                            <Chip
                              label={t('groups.admin')}
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                          {member._id === user._id && (
                            <Chip
                              label={t('groups.you')}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={member.title || t('groups.noTitle')}
                    />
                    {isAdmin() && member._id !== user._id && (
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="remove">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('groups.noMembers')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      case 2: // Requests (только для администратора)
        return (
          <Box sx={{ mt: 3 }}>
            {membershipRequests.length > 0 ? (
              <List>
                {membershipRequests.map((request) => (
                  <ListItem key={request._id}>
                    <ListItemAvatar>
                      <Avatar src={request.user?.avatar} alt={request.user?.username}>
                        {request.user?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={request.user?.username}
                      secondary={`${t('groups.requestedOn')} ${formatDate(request.date)}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="approve"
                        color="success"
                        onClick={() => handleMembershipRequest(request._id, 'approve')}
                        disabled={processingRequest}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="reject"
                        color="error"
                        onClick={() => handleMembershipRequest(request._id, 'reject')}
                        disabled={processingRequest}
                        sx={{ ml: 1 }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {t('groups.noRequests')}
                </Typography>
              </Paper>
            )}
          </Box>
        );
      
      default:
        return null;
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
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/groups')}
        >
          {t('groups.backToGroups')}
        </Button>
      </Container>
    );
  }
  
  if (!group) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('groups.groupNotFound')}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/groups')}
        >
          {t('groups.backToGroups')}
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/groups')}
        >
          {t('groups.backToGroups')}
        </Button>
        
        <Box>
          {isAdmin() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SettingsIcon />}
              onClick={() => navigate(`/groups/${id}/settings`)}
              sx={{ mr: 1 }}
            >
              {t('groups.settings')}
            </Button>
          )}
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<LeaveIcon />}
            onClick={handleLeaveGroup}
          >
            {t('groups.leave')}
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GroupIcon fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {group.name}
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {group.description}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={group.category ? t(`groups.categories.${group.category}`) : t('groups.categories.general')}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={group.isPrivate ? t('groups.private') : t('groups.public')}
            color={group.isPrivate ? 'default' : 'success'}
            variant="outlined"
          />
          <Chip
            label={`${group.members?.length || 0} ${t('groups.members')}`}
            icon={<GroupIcon />}
            variant="outlined"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {t('groups.createdOn')}: {formatDate(group.createdAt)}
        </Typography>
      </Paper>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={t('groups.activity')} />
          <Tab label={t('groups.members')} />
          {isAdmin() && <Tab label={t('groups.requests')} />}
        </Tabs>
      </Paper>
      
      {renderTabContent()}
    </Container>
  );
};

export default GroupDetail; 