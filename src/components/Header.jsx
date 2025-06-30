import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Button
} from '@mui/material';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [reportAnchorEl, setReportAnchorEl] = useState(null);
  const [functionAnchorEl, setFunctionAnchorEl] = useState(null);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleReportMenuOpen = (event) => setReportAnchorEl(event.currentTarget);
  const handleReportMenuClose = () => setReportAnchorEl(null);
  const handleFunctionMenuOpen = (event) => setFunctionAnchorEl(event.currentTarget);
  const handleFunctionMenuClose = () => setFunctionAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#7a94a6',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
        {/* ✅ Logo + Company Info */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff' }}>
              eBudget System
            </Typography>
            <Typography variant="caption" sx={{ color: '#dce3e8' }}>
              {user?.company_name || 'N/A'} ・ {user?.currency || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* ✅ Center Menu Items */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Function Dropdown */}
          <Button
            onClick={handleFunctionMenuOpen}
            sx={{
              color: '#dce3e8',
              fontWeight: 'normal',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            Function
          </Button>
          <Menu
            anchorEl={functionAnchorEl}
            open={Boolean(functionAnchorEl)}
            onClose={handleFunctionMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuItem onClick={() => { navigate('/budget-input'); handleFunctionMenuClose(); }}>Budget Input</MenuItem>
            <MenuItem onClick={() => { navigate('/budget-upload'); handleFunctionMenuClose(); }}>Budget Upload</MenuItem>
            <MenuItem onClick={() => { navigate('/ppe-input'); handleFunctionMenuClose(); }}>PPE Input</MenuItem>
          </Menu>

          {/* Report Dropdown */}
          <Button
            onClick={handleReportMenuOpen}
            sx={{
              color: '#dce3e8',
              fontWeight: 'normal',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            Report
          </Button>
          <Menu
            anchorEl={reportAnchorEl}
            open={Boolean(reportAnchorEl)}
            onClose={handleReportMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuItem onClick={() => { handleReportMenuClose(); navigate('/report/pnl'); }}>PNL Report</MenuItem>
            <MenuItem onClick={() => { handleReportMenuClose(); navigate('/report/pnl-summary'); }}>
              PNL Summary
            </MenuItem>

          </Menu>
        </Box>

        {/* ✅ Right Avatar */}
        <Box>
          <IconButton onClick={handleAvatarClick} size="large">
            <Avatar sx={{ bgcolor: '#ffffff', color: '#7a94a6' }}>
              {user?.userid?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>{user?.cost_center_name}</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
