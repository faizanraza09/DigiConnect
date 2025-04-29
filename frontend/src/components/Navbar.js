import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  RecyclingRounded,
  Analytics,
  Feedback
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          component={RouterLink}
          to="/"
        >
          <RecyclingRounded />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component={RouterLink} 
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            cursor: 'pointer'
          }}
        >
          DigiCycle
        </Typography>

        {user ? (
          <>
            {user.role === 'admin' ? (
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/admin"
                >
                  Admin Dashboard
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/admin/analytics"
                  startIcon={<Analytics />}
                >
                  Analytics
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.userType === 'household' ? (
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/create-pickup"
                  >
                    Request Pickup
                  </Button>
                ) : (
                  <Button
                    color="inherit"
                    component={RouterLink}
                    to="/find-pickups"
                  >
                    Find Pickups
                  </Button>
                )}
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/my-pickups"
                >
                  My Pickups
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/analytics"
                  startIcon={<Analytics />}
                >
                  Analytics
                </Button>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/feedback"
                  startIcon={<Feedback />}
                >
                  Feedback
                </Button>
              </Box>
            )}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 