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
  Add as AddIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import AddHabitModal from './AddHabitModal';
import UserProgress from './UserProgress';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
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
        return 'Dashboard';
      case '/achievements':
        return 'Achievements';
      case '/profile':
        return 'Profile';
      default:
        if (location.pathname.startsWith('/habits/')) {
          return 'Habit Details';
        }
        return 'Habit Hero';
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
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        <ListItem button onClick={() => handleNavigate('/achievements')} selected={location.pathname === '/achievements'}>
          <ListItemIcon>
            <Badge badgeContent={user?.achievements?.length || 0} color="secondary">
              <AchievementsIcon color={location.pathname === '/achievements' ? 'primary' : 'inherit'} />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Achievements" />
        </ListItem>
        
        <ListItem button onClick={() => handleNavigate('/profile')} selected={location.pathname === '/profile'}>
          <ListItemIcon>
            <ProfileIcon color={location.pathname === '/profile' ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
      
      <Divider />
      
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
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
            
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<AddIcon />}
              onClick={() => setAddHabitOpen(true)}
              sx={{ mr: 2 }}
            >
              Add Habit
            </Button>
            
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.username} src="/static/images/avatar/2.jpg">
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
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
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
          <Outlet />
        </Container>
      </Box>
      
      <AddHabitModal open={addHabitOpen} onClose={() => setAddHabitOpen(false)} />
    </>
  );
};

export default Layout; 