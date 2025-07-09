// Dashboard.js
import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress
} from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

import { useSelector } from 'react-redux';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement
);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [data2024, setData2024] = useState([]);
  const [data2025, setData2025] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPNL = async () => {
      try {
        const [res2024, res2025] = await Promise.all([
          axiosInstance.get('/report/pnl', {
            params: {
              glyear: 2024,
              company: user?.company_name,
              _: Date.now()
            }
          }),
          axiosInstance.get('/report/pnl', {
            params: {
              glyear: 2025,
              company: user?.company_name,
              _: Date.now()
            }
          })
        ]);
        setData2024(res2024.data.data || []);
        setData2025(res2025.data.data || []);
      } catch (err) {
        console.error('Failed to fetch PNL data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPNL();
  }, [user]);

  const getYTD = (values) => months.reduce((sum, m) => sum + (parseFloat(values[m]) || 0), 0);

  const getYTDByLvl1 = (data, lvl1) =>
    data.filter(r => r.lvl1 === lvl1).reduce((sum, r) => sum + getYTD(r.values), 0);

  const getYTDByName = (data, keyword) => {
    const match = data.find(r => r.gl_account_long_name.toLowerCase().includes(keyword.toLowerCase()));
    return match ? getYTD(match.values) : 0;
  };

  const revenueThisYear = getYTDByLvl1(data2025, 1);
  const revenueLastYear = getYTDByLvl1(data2024, 1);
  const costThisYear = data2025
    .filter(r => r.sub1 === 'COST OF SALES' && r.gl_code !== 'FORMULA')
    .reduce((sum, r) => sum + getYTD(r.values), 0);

  const costLastYearData = data2024
    .filter(r => r.sub1 === 'COST OF SALES' && r.gl_code !== 'FORMULA');

    console.log('[COST OF SALES] Last Year Breakdown:',
      costLastYearData
        .map(r => ({ code: r.gl_code, name: r.gl_account_long_name, ytd: getYTD(r.values) }))
        .filter(r => r.ytd !== 0)
    );
    

  const costLastYear = costLastYearData.reduce((sum, r) => sum + getYTD(r.values), 0);
  const gpThisYear = getYTDByName(data2025, 'gross profit');
  const gpLastYear = getYTDByName(data2024, 'gross profit');
  const npThisYear = getYTDByName(data2025, 'net profit after tax');
  const npLastYear = getYTDByName(data2024, 'net profit after tax');

  const expenseBreakdown = data2025.filter(item => item.lvl1 === 4 || item.lvl1 === 5);

  const summaryCard = (title, value, lastYear, color = 'primary.main') => {
    const diff = value - lastYear;
    const pct = lastYear !== 0 ? (diff / Math.abs(lastYear)) * 100 : 0;
    const trendColor = pct > 0 ? 'green' : pct < 0 ? 'red' : 'gray';

    return (
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: `6px solid`, borderColor: color }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
            <Typography variant="h6">
              {value.toLocaleString(undefined, { minimumFractionDigits: 2 })} M
            </Typography>
            <Typography variant="body2" sx={{ color: trendColor }}>
              ({pct.toFixed(1)}%) vs 去年
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const expensePieData = {
    labels: expenseBreakdown.map(i => i.sub1),
    datasets: [{
      data: expenseBreakdown.map(i => getYTD(i.values)),
      backgroundColor: [
        '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ff7043', '#26c6da'
      ]
    }]
  };

  const categoryLabels = [...new Set([
    ...data2024,
    ...data2025
  ].filter(i => i.sub1 === 'REVENUE').map(i => i.sub_title))];

  const groupByYearAndTitle = (dataset) => {
    return categoryLabels.map(title => {
      const match = dataset.find(i => i.sub_title === title && i.sub1 === 'REVENUE');
      return match ? getYTD(match.values) : 0;
    });
  };

  const revenueCategoryBarData = {
    labels: categoryLabels,
    datasets: [
      {
        label: '去年',
        data: groupByYearAndTitle(data2024),
        backgroundColor: '#90caf9'
      },
      {
        label: '今年',
        data: groupByYearAndTitle(data2025),
        backgroundColor: '#1976d2'
      }
    ]
  };

  if (loading) return <CircularProgress sx={{ mt: 10 }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>📊 Financial Dashboard</Typography>

      <Grid container spacing={3}>
        {summaryCard('Revenue', revenueThisYear, revenueLastYear)}
        {summaryCard('Cost of Sales', costThisYear, costLastYear, 'error.main')}
        {summaryCard('Gross Profit', gpThisYear, gpLastYear, 'success.main')}
        {summaryCard('Net Profit', npThisYear, npLastYear, 'secondary.main')}

        {/* <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Expense Breakdown</Typography>
              <Pie data={expensePieData} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Revenue by Product Category</Typography>
              <Bar data={revenueCategoryBarData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>
    </Box>
  );
};

export default Dashboard;
