import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CryptoJS from 'crypto-js';

const secretKey = process.env.REACT_APP_SECRET_KEY;

const Background = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#f5f7fa',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

const FormCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 420,
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  backgroundColor: '#ffffff',
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: '#7a94a6',
  '&:hover': {
    backgroundColor: '#6c8495',
  },
}));

const LoginPageCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    cost_center_name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ 兼容 HashRouter：从 location.hash 解析参数
    const hash = location.hash || ''; // e.g. #/login?reason=kicked
    const query = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(query);
    const reason = params.get('reason');

    if (reason === 'kicked') {
      setWarning('⚠️ This session has been terminated because your account was logged in from another device.');
    } else if (reason === 'logout') {
      setWarning('You have logged out successfully.');
    } else if (reason === 'expired') {
      setWarning('Your session has expired. Please log in again.');
    }

    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate, location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setLoading(true);

    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(formData), secretKey).toString();
      const result = await dispatch(login({ data: encrypted }));

      if (result.payload) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <FormCard elevation={3}>
        <Typography variant="h4" sx={{ color: '#3d4852', mb: 1, fontWeight: 'bold' }}>
          Welcome to eBudget
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#6c7a80', mb: 3 }}>
          Plan better. Budget smarter.
        </Typography>

        {warning && (
          <Alert severity="warning" sx={{ width: '100%' }}>
            {warning}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        <StyledForm onSubmit={handleSubmit}>
          <TextField
            variant="outlined"
            required
            fullWidth
            id="cost_center_name"
            label="Cost Center Name"
            name="cost_center_name"
            autoComplete="off"
            autoFocus
            value={formData.cost_center_name}
            onChange={handleChange}
          />

          <TextField
            variant="outlined"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
          />
          <SubmitButton
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </SubmitButton>
        </StyledForm>
      </FormCard>
    </Background>
  );
};

export default LoginPageCenter;
