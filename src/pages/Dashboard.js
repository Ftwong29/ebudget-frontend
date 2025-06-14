import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress, Divider, MenuItem, Select, FormControl, InputLabel, Chip
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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2025);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosInstance.get('/report/pnl-summary', {
          params: {
            glyear: year,
            company: user?.company_name
          }
        });
        setSummary(res.data.summary);
      } catch (err) {
        console.error('Failed to fetch PNL summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user, year]);

  const importantMetrics = [
    { label: 'Revenue', value: summary?.revenue },
    { label: 'Gross Profit', value: summary?.gross_profit },
    { label: 'Net Profit After Tax', value: summary?.net_profit_after_tax },
    { label: 'Retained Profit', value: summary?.retained_profit_carried_forward },
  ];

  const barData = [
    { name: 'Revenue', value: summary?.revenue || 0 },
    { name: 'Cost of Sales', value: summary?.total_cost_of_sales || 0 },
    { name: 'Gross Profit', value: summary?.gross_profit || 0 },
    { name: 'Finance Cost', value: summary?.finance_cost || 0 },
    { name: 'Net Profit', value: summary?.net_profit_after_tax || 0 },
  ];

  const pieData = [
    { name: 'Revenue', value: summary?.revenue || 0 },
    { name: 'Gross Profit', value: summary?.gross_profit || 0 },
    { name: 'Net Profit', value: summary?.net_profit_after_tax || 0 },
  ];

  return (
    <MainContainer>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, color: '#4d4f4c' }}>
          📊 Financial Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: '#757875', mb: 3 }}>
          A quick glance at your company's financial health for {user?.company_name}.
        </Typography>

        <FormControl sx={{ mb: 4, minWidth: 140 }} size="small">
          <InputLabel>Year</InputLabel>
          <Select
            value={year}
            label="Year"
            onChange={(e) => setYear(e.target.value)}
          >
            {[2023, 2024, 2025].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Grid container spacing={3}>
              {importantMetrics.map(({ label, value }, index) => (
                <Grid item xs={12} sm={6} md={3} key={label}>
                  <Card>
                    <Typography variant="subtitle2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h6" sx={{ color: COLORS[index % COLORS.length], fontWeight: 700 }}>
                      {value?.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box mt={6}>
              <SectionTitle variant="h6">PNL Breakdown Overview</SectionTitle>
              <Paper sx={{ p: 3, height: 360, borderRadius: 4, backgroundColor: '#fff', mb: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fill: '#4b4b4b' }} />
                    <YAxis tick={{ fill: '#4b4b4b' }} />
                    <Tooltip formatter={(val) => val.toLocaleString('en-MY', { minimumFractionDigits: 2 })} />
                    <Bar dataKey="value" fill="#b5c7bd">
                      <LabelList dataKey="value" position="top" formatter={(val) => val.toLocaleString('en-MY')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              <SectionTitle variant="h6">Profit Composition</SectionTitle>
              <Paper sx={{ p: 3, height: 360, borderRadius: 4, backgroundColor: '#fff' }}>
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