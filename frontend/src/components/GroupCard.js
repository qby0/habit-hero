import React, { useState, useContext } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  ExitToApp as LeaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const GroupCard = ({ group, onLeave, refreshGroups }) => {
  const { t } = useTranslation();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  
  const handleLeaveClick = () => {
    handleMenuClose();
    setLeaveDialogOpen(true);
  };
  
  const handleSettingsClick = () => {
    handleMenuClose();
    navigate(`/groups/${group._id}/settings`);
  };
  
  const handleLeaveConfirm = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/groups/${group._id}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success(t('groups.leftSuccess'));
      if (onLeave) onLeave(group._id);
      if (refreshGroups) refreshGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
      setLeaveDialogOpen(false);
    }
  };
  
  const handleGroupClick = () => {
    navigate(`/groups/${group._id}`);
  };
  
  // Проверяем, является ли пользователь администратором группы
  const isAdmin = () => {
    return group.admin === user._id;
  };
  
  // Форматируем дату создания группы
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Получаем количество участников
  const getMemberCount = () => {
    return group.members ? group.members.length : 0;
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={handleGroupClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {group.name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {group.isPrivate ? (
              <Tooltip title={t('groups.private')}>
                <LockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              </Tooltip>
            ) : (
              <Tooltip title={t('groups.public')}>
                <PublicIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              </Tooltip>
            )}
            
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e);
              }}
              aria-label="group options"
            >
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
            >
              {isAdmin() && (
                <MenuItem onClick={handleSettingsClick}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  {t('groups.settings')}
                </MenuItem>
              )}
              <MenuItem onClick={handleLeaveClick}>
                <LeaveIcon fontSize="small" sx={{ mr: 1 }} />
                {t('groups.leave')}
              </MenuItem>
            </Menu>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 1 }}>
          <Chip 
            label={group.category ? t(`groups.categories.${group.category}`) : t('groups.categories.general')} 
            size="small" 
            sx={{ mr: 1 }}
            className={`badge-${group.category || 'general'}`}
          />
          <Chip 
            label={`${getMemberCount()} ${t('groups.members')}`} 
            size="small"
            icon={<GroupIcon fontSize="small" />}
          />
        </Box>
        
        {group.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {group.description}
          </Typography>
        )}
        
        {group.members && group.members.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('groups.members')}:
            </Typography>
            <AvatarGroup max={5} sx={{ justifyContent: 'flex-start' }}>
              {group.memberDetails && group.memberDetails.map((member) => (
                <Avatar 
                  key={member._id} 
                  alt={member.username} 
                  src={member.avatar}
                  sx={{ width: 30, height: 30 }}
                >
                  {member.username.charAt(0).toUpperCase()}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('groups.createdOn')}:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatDate(group.createdAt)}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, pt: 1 }}>
        <Button 
          fullWidth 
          variant="contained" 
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleGroupClick();
          }}
        >
          {t('groups.viewDetails')}
        </Button>
      </CardActions>
      
      {/* Диалог подтверждения выхода из группы */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>{t('groups.leave')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isAdmin() 
              ? t('groups.confirmLeaveAdmin') 
              : t('groups.confirmLeave')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)} color="inherit">
            {t('groups.cancel')}
          </Button>
          <Button onClick={handleLeaveConfirm} color="error" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t('groups.leave')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default GroupCard; 