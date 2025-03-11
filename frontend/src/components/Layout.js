import React, { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  EmojiEvents as AchievementsIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import AddHabitModal from './AddHabitModal';
import UserProgress from './UserProgress';
import LanguageSwitcher from './LanguageSwitcher';
import PageTransition from './PageTransition';
import { useTranslation } from 'react-i18next';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addHabitOpen, setAddHabitOpen] = useState(false);
  
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return t('dashboard.yourHabits');
      case '/achievements':
        return t('achievements.achievements');
      case '/profile':
        return t('profile.profile');
      case '/workshop':
        return t('workshop.title');
      default:
        if (location.pathname.startsWith('/habits/')) {
          return t('habits.title');
        }
        if (location.pathname.startsWith('/workshop/')) {
          return t('workshop.habitDetails');
        }
        return t('app.title');
    }
  };
  
  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'primary.main',
            mb: 1
          }}
        >
          {user?.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h6">{user?.username}</Typography>
        <UserProgress user={user} />
      </Box>
      
      <Divider />
      
      <List>
        <ListItem button onClick={() => handleNavigate('/')} selected={location.pathname === '/'}>
          <ListItemIcon>
            <DashboardIcon color={location.pathname === '/' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('dashboard.yourHabits')} />
        </ListItem>
        
        <ListItem button onClick={() => handleNavigate('/workshop')} selected={location.pathname.startsWith('/workshop')}>
          <ListItemIcon>
            <StoreIcon color={location.pathname.startsWith('/workshop') ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('workshop.title')} />
        </ListItem>
        
        <ListItem button onClick={() => handleNavigate('/achievements')} selected={location.pathname === '/achievements'}>
          <ListItemIcon>
            <Badge badgeContent={user?.achievements?.length || 0} color="secondary">
              <AchievementsIcon color={location.pathname === '/achievements' ? 'primary' : 'inherit'} />
            </Badge>
          </ListItemIcon>
          <ListItemText primary={t('achievements.achievements')} />
        </ListItem>
        
        <ListItem button onClick={() => handleNavigate('/profile')} selected={location.pathname === '/profile'}>
          <ListItemIcon>
            <ProfileIcon color={location.pathname === '/profile' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary={t('profile.profile')} />
        </ListItem>
      </List>
      
      <Divider />
      
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('auth.logout')} />
        </ListItem>
      </List>
    </Box>
  );
  
  return (
    <>
      <AppBar position="fixed">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              {getPageTitle()}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSwitcher />
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<AddIcon />}
                onClick={() => setAddHabitOpen(true)}
                sx={{ mr: 2 }}
              >
                {t('dashboard.addHabit')}
              </Button>
              
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title={t('profile.profile')}>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={user?.username}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                    <Typography textAlign="center">{t('profile.profile')}</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">{t('auth.logout')}</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Container>
      </Box>
      
      <AddHabitModal open={addHabitOpen} onClose={() => setAddHabitOpen(false)} />
    </>
  );
};

export default Layout; 