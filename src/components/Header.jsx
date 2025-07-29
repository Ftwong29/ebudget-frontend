import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import axiosInstance from '../api/axiosInstance';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slide,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const [reportAnchorEl, setReportAnchorEl] = useState(null);
  const [functionAnchorEl, setFunctionAnchorEl] = useState(null);
  const [budgetLock, setBudgetLock] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  useEffect(() => {
    const fetchBudgetLock = async () => {
      const res = await axiosInstance.get(`/budget-lock/status?glyear=${new Date().getFullYear()}`);
      setBudgetLock(res.data);
    };
    fetchBudgetLock();
  }, []);

  const handleSubmit = async () => {
    const confirmed = window.confirm("Are you sure you want to submit? Once submitted, you will not be able to modify any figures unless a request to unlock is approved.");
    if (!confirmed) return;

    await axiosInstance.post('/budget-lock/submit', { glyear: new Date().getFullYear() });
    setBudgetLock({ ...budgetLock, is_submitted: true });

    // ✅ 通知其他组件刷新锁状态
    window.dispatchEvent(new Event('budget-submitted'));
  };

  const handleRequestUnlock = async () => {
    await axiosInstance.post('/budget-lock/request-unlock', { glyear: new Date().getFullYear(), reason: unlockReason });
    setDialogOpen(false);
    setUnlockReason('');
    setBudgetLock({ ...budgetLock, unlock_requested: true });
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            onClick={handleFunctionMenuOpen}
            sx={{
              color: '#dce3e8',
              fontWeight: 'normal',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              backgroundColor: 'transparent',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            Function
          </Button>
          <Menu anchorEl={functionAnchorEl} open={Boolean(functionAnchorEl)} onClose={handleFunctionMenuClose}>
            <MenuItem onClick={() => { navigate('/budget-input'); handleFunctionMenuClose(); }}>Budget Input</MenuItem>
            <MenuItem onClick={() => { navigate('/budget-upload'); handleFunctionMenuClose(); }}>Budget Upload</MenuItem>
            <MenuItem onClick={() => { navigate('/ppe-input'); handleFunctionMenuClose(); }}>PPE Input</MenuItem>
          </Menu>

          <Button
            onClick={handleReportMenuOpen}
            sx={{
              color: '#dce3e8',
              fontWeight: 'normal',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              backgroundColor: 'transparent',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            Report
          </Button>
          <Menu anchorEl={reportAnchorEl} open={Boolean(reportAnchorEl)} onClose={handleReportMenuClose}>
            <MenuItem onClick={() => { handleReportMenuClose(); navigate('/report/pnl'); }}>PNL</MenuItem>
            <MenuItem onClick={() => { handleReportMenuClose(); navigate('/report/ppe'); }}>PPE</MenuItem>
          </Menu>
        </Box>

        {/* ✅ Right Side: Submit/Unlock + Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {budgetLock?.is_submitted ? (
            budgetLock?.unlock_requested ? (
              <Tooltip title="You’ve already requested to unlock. Please wait for approval.">
                <Button
                  startIcon={<CheckCircleIcon />}
                  disabled
                  sx={{
                    borderRadius: 3,
                    textTransform: 'none',
                    backgroundColor: '#a5d6a7',
                    '&:hover': { backgroundColor: '#81c784' }
                  }}
                >
                  Requested
                </Button>
              </Tooltip>
            ) : (
              <Button variant="outlined" onClick={() => setDialogOpen(true)} sx={{ borderRadius: 3, fontWeight: 500 }}>
                Request Unlock
              </Button>
            )
          ) : (
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSubmit}
              sx={{ borderRadius: 3, fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
            >
              Submit Budget
            </Button>
          )}

          <IconButton onClick={handleAvatarClick} size="large">
            <Avatar sx={{ bgcolor: '#ffffff', color: '#7a94a6' }}>
              {user?.userid?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>{user?.cost_center_name}</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Request Unlock Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} TransitionComponent={Slide} transitionDuration={300}>
        <DialogTitle sx={{ fontWeight: 600, color: '#3a3f4a' }}>Request Unlock</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for unlocking"
            multiline
            fullWidth
            rows={4}
            variant="outlined"
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRequestUnlock} endIcon={<SendIcon />}>Submit Request</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Header;
