import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress, Chip, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, PieChart, Pie, Cell, Legend
} from 'recharts';

const MainContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#f0efeb',
  display: 'flex',
  flexDirection: 'column',
}));

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  backgroundColor: '#fffaf5',
  boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
  height: '100%',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: '#6d726f',
  fontWeight: 600,
  marginBottom: theme.spacing(2),
}));

const COLORS = ['#7a94a6', '#b5c7bd', '#d4a5a5', '#c5a880', '#a9a9b3'];

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [summary2025, setSummary2025] = useState(null);
  const [summary2024, setSummary2024] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const [res2025, res2024] = await Promise.all([
          axiosInstance.get('/report/pnl-summary', {
            params: { glyear: 2025, company: user?.company_name },
          }),
          axiosInstance.get('/report/pnl-summary', {
            params: { glyear: 2024, company: user?.company_name },
          }),
        ]);
        setSummary2025(res2025.data.summary);
        setSummary2024(res2024.data.summary);
      } catch (err) {
        console.error('Failed to fetch summary reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, [user]);

  const importantMetrics = [
    'revenue',
    'gross_profit',
    'net_profit_after_tax',
    'retained_profit_carried_forward'
  ];

  const marginRatio = summary2025 && summary2025.revenue
    ? (summary2025.gross_profit / summary2025.revenue * 100).toFixed(1)
    : '0.0';

  const barData = importantMetrics.map((key) => ({
    name: key.replace(/_/g, ' ').toUpperCase(),
    '2025': summary2025?.[key] || 0,
    '2024': summary2024?.[key] || 0,
  }));

  const pieData = [
    { name: 'Revenue', value: summary2025?.revenue || 0 },
    { name: 'Gross Profit', value: summary2025?.gross_profit || 0 },
    { name: 'Net Profit', value: summary2025?.net_profit_after_tax || 0 },
  ];

  return (
    <MainContainer>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: '#4d4f4c' }}>
          📊 Financial Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#757875', mb: 3 }}>
          Budgeted performance comparison for {user?.company_name} (2024 vs 2025).
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <Chip label={`Gross Margin (2025): ${marginRatio}%`} color="success" variant="outlined" />
          </Grid>
        </Grid>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid container spacing={3}>
              {importantMetrics.map((label, index) => (
                <Grid item xs={12} sm={6} md={3} key={label}>
                  <Card>
                    <Typography variant="subtitle2" color="text.secondary">
                      {label.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="h6" sx={{ color: COLORS[index % COLORS.length], fontWeight: 700 }}>
                      {summary2025?.[label]?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (2024: {summary2024?.[label]?.toLocaleString('en-MY', { minimumFractionDigits: 2 })})
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box mt={6}>
              <SectionTitle variant="h6">PNL Breakdown (2024 vs 2025)</SectionTitle>
              <Paper sx={{ p: 3, height: 360, borderRadius: 4, backgroundColor: '#ffffff', mb: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: '#4b4b4b' }} />
                    <YAxis tick={{ fill: '#4b4b4b' }} />
                    <Tooltip formatter={(val) => val.toLocaleString('en-MY', { minimumFractionDigits: 2 })} />
                    <Legend />
                    <Bar dataKey="2025" fill="#7a94a6" />
                    <Bar dataKey="2024" fill="#d4a5a5" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              <SectionTitle variant="h6">Profit Composition (2025)</SectionTitle>
              <Paper sx={{ p: 3, height: 360, borderRadius: 4, backgroundColor: '#ffffff' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      label={({ name }) => name}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => val.toLocaleString('en-MY', { minimumFractionDigits: 2 })} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    </MainContainer>
  );
};

export default DashboardPage;
