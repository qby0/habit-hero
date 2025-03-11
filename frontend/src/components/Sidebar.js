import React, { useContext } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Leaderboard as LeaderboardIcon,
  Settings as SettingsIcon,
  Whatshot as FireIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ open }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // Определяем активный путь
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Список пунктов меню
  const menuItems = [
    {
      text: t('sidebar.dashboard'),
      icon: <DashboardIcon />,
      path: '/',
      badge: null
    },
    {
      text: t('sidebar.challenges'),
      icon: <FireIcon />,
      path: '/challenges',
      badge: 3 // Пример: количество доступных испытаний
    },
    {
      text: t('sidebar.groups'),
      icon: <GroupIcon />,
      path: '/groups',
      badge: null
    },
    {
      text: t('sidebar.leaderboard'),
      icon: <LeaderboardIcon />,
      path: '/leaderboard',
      badge: null
    },
    {
      text: t('sidebar.achievements'),
      icon: <TrophyIcon />,
      path: '/achievements',
      badge: user?.unlockedAchievements?.length || null
    },
    {
      text: t('sidebar.workshop'),
      icon: <SchoolIcon />,
      path: '/workshop',
      badge: null
    },
    {
      text: t('sidebar.profile'),
      icon: <PersonIcon />,
      path: '/profile',
      badge: null
    }
  ];
  
  return (
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <Tooltip title={open ? '' : item.text} placement="right">
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '8px',
                  mx: 1,
                  my: 0.5
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isActive(item.path) ? 'primary.main' : 'inherit'
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal'
                  }} 
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );
};

export default Sidebar; 