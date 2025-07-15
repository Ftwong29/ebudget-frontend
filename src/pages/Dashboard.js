// Dashboard.js
import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, FormControlLabel, Switch
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  LineElement,        // ✅ 加这个
  PointElement,       // ✅ 加这个
} from 'chart.js';
import { useSelector } from 'react-redux';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  LineElement,      // 👈 新增
  PointElement,     // 👈 新增
);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [data2024, setData2024] = useState([]);
  const [data2025, setData2025] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showZero, setShowZero] = useState(false);


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

  const summaryCard = (title, value, lastYear, color = 'primary.main') => {
    const diff = value - lastYear;
    const pct = lastYear !== 0 ? (diff / Math.abs(lastYear)) * 100 : 0;
    const trendColor = pct > 0 ? 'green' : pct < 0 ? 'red' : 'gray';

    return (
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: `6px solid`, borderColor: color }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>

            {/* This Year */}
            <Typography variant="h6" sx={{ mt: 1 }}>
              {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>

            {/* Last Year */}
            <Typography variant="body2" color="text.disabled">
              Last Year: {lastYear.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Typography>

            {/* Difference Percentage */}
            <Typography variant="body2" sx={{ color: trendColor }}>
              ({pct.toFixed(1)}%)
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };


  const revenueThisYear = getYTDByLvl1(data2025, 1);
  const revenueLastYear = getYTDByLvl1(data2024, 1);

  const directExpensesLastYear = getYTDByLvl1(data2024, 4);
  const directExpensesThisYear = getYTDByLvl1(data2025, 4);

  const getMonthlyByLvl1 = (data, lvl1) => {
    return months.map(m => {
      return data
        .filter(r => r.lvl1 === lvl1)
        .reduce((sum, r) => sum + (parseFloat(r.values[m]) || 0), 0);
    });
  };

  const revenue2024Monthly = getMonthlyByLvl1(data2024, 1);
  const revenue2025Monthly = getMonthlyByLvl1(data2025, 1);
  const direct2024Monthly = getMonthlyByLvl1(data2024, 4);
  const direct2025Monthly = getMonthlyByLvl1(data2025, 4);



  const revenueVsDirectLineChartData = {
    labels: ['2024', '2025'],
    datasets: [
      {
        label: 'Revenue',
        data: [revenueLastYear, revenueThisYear],
        borderColor: '#1976d2',
        backgroundColor: '#1976d2',
        tension: 0.3
      },
      {
        label: 'Direct Expenses',
        data: [directExpensesLastYear, directExpensesThisYear],
        borderColor: '#ffa726',
        backgroundColor: '#ffa726',
        tension: 0.3
      }
    ]
  };

  const revenueVsDirectMonthlyLineChartData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue 2025',
        data: revenue2025Monthly,
        borderColor: '#1976d2',
        backgroundColor: '#1976d2',
        tension: 0.3,
          yAxisID: 'y'
      },
      {
        label: 'Revenue 2024',
        data: revenue2024Monthly,
        borderColor: '#90caf9',
        backgroundColor: '#90caf9',
        tension: 0.3,
          yAxisID: 'y'
      },
      {
        label: 'Direct Expenses 2025',
        data: direct2025Monthly,
        borderColor: '#ffa726',
        backgroundColor: '#ffa726',
        tension: 0.3,
          yAxisID: 'y1'
      },
      {
        label: 'Direct Expenses 2024',
        data: direct2024Monthly,
        borderColor: '#ffcc80',
        backgroundColor: '#ffcc80',
        tension: 0.3,
          yAxisID: 'y1'
      }
      
    ]
  };




  const costThisYear = data2025
    .filter(r => r.sub1 === 'COST OF SALES' && r.gl_code !== 'FORMULA')
    .reduce((sum, r) => sum + getYTD(r.values), 0);

  const costLastYearData = data2024
    .filter(r => r.sub1 === 'COST OF SALES' && r.gl_code !== 'FORMULA');

  const costLastYear = costLastYearData.reduce((sum, r) => sum + getYTD(r.values), 0);
  const gpThisYear = getYTDByName(data2025, 'gross profit');
  const gpLastYear = getYTDByName(data2024, 'gross profit');
  const npThisYear = getYTDByName(data2025, 'net profit after tax');
  const npLastYear = getYTDByName(data2024, 'net profit after tax');

  const allRevenue = [...data2024, ...data2025].filter(i => i.sub1 === 'REVENUE');
  const categoryLabels = [...new Set(allRevenue.map(i => i.product_category))];

  const getYTDForCategory = (data, category) =>
    data.filter(i => i.sub1 === 'REVENUE' && i.product_category === category)
      .reduce((sum, r) => sum + getYTD(r.values), 0);

  const visibleLabels = categoryLabels.filter(category => {
    const val2024 = getYTDForCategory(data2024, category);
    const val2025 = getYTDForCategory(data2025, category);
    return showZero || val2024 !== 0 || val2025 !== 0;
  });

  const revenueCategoryBarData = {
    labels: visibleLabels,
    datasets: [
      {
        label: '2025',
        data: visibleLabels.map(category => getYTDForCategory(data2025, category)),
        backgroundColor: '#1976d2'
      },
      {
        label: '2024',
        data: visibleLabels.map(category => getYTDForCategory(data2024, category)),
        backgroundColor: '#90caf9'
      }

    ]
  };


  const allMaintenance = [...data2024, ...data2025]
    .filter(item => item.lvl1 === 2 && item.lvl2 === 3 && item.lvl3 === 1);

  const maintenanceLabels = [...new Set(allMaintenance.map(i => i.gl_account_short_name))]
    .filter(name => {
      const val2024 = getYTD(data2024.find(i => i.gl_account_short_name === name)?.values || {});
      const val2025 = getYTD(data2025.find(i => i.gl_account_short_name === name)?.values || {});
      return showZero || val2024 !== 0 || val2025 !== 0;
    });

  const maintenanceChartData = {
    labels: maintenanceLabels,
    datasets: [
      {
        label: '2025',
        data: maintenanceLabels.map(name => getYTD(data2025.find(i => i.gl_account_short_name === name)?.values || {})),
        backgroundColor: '#1976d2'
      },
      {
        label: '2024',
        data: maintenanceLabels.map(name => getYTD(data2024.find(i => i.gl_account_short_name === name)?.values || {})),
        backgroundColor: '#90caf9'
      }

    ]
  };

  const allExpensesBreakdown = [...data2024, ...data2025]
    .filter(item => item.lvl1 === 5);

  const ExpensesBreakdownLabels = [...new Set(allExpensesBreakdown.map(i => i.sub_title))]
    .filter(name => {
      const val2024 = getYTD(data2024.find(i => i.sub_title === name)?.values || {});
      const val2025 = getYTD(data2025.find(i => i.sub_title === name)?.values || {});
      return showZero || val2024 !== 0 || val2025 !== 0;
    });

  const ExpensesBreakdownChartData = {
    labels: ExpensesBreakdownLabels,
    datasets: [
      {
        label: '2025',
        data: ExpensesBreakdownLabels.map(name => getYTD(data2025.find(i => i.sub_title === name)?.values || {})),
        backgroundColor: '#1976d2'
      },
      {
        label: '2024',
        data: ExpensesBreakdownLabels.map(name => getYTD(data2024.find(i => i.sub_title === name)?.values || {})),
        backgroundColor: '#90caf9'
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Revenue by Product Category (2024 vs 2025)</Typography>
                <FormControlLabel
                  control={<Switch checked={showZero} onChange={(e) => setShowZero(e.target.checked)} />}
                  label="Show Zero"
                />
              </Box>
              <Bar data={revenueCategoryBarData} options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { x: { ticks: { maxRotation: 90, minRotation: 45 } } }
              }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Maintenance Cost Breakdown</Typography>
                <FormControlLabel
                  control={<Switch checked={showZero} onChange={(e) => setShowZero(e.target.checked)} />}
                  label="Show Zero"
                />
              </Box>
              <Bar
                data={maintenanceChartData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Revenue vs. Direct Expenses Trend by Month
              </Typography>
              <Line
                data={revenueVsDirectMonthlyLineChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      title: { display: true, text: 'Revenue' },
                      ticks: {
                        callback: (value) => value.toLocaleString()
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: { drawOnChartArea: false },
                      beginAtZero: true,
                      title: { display: true, text: 'Direct Expenses' },
                      ticks: {
                        callback: (value) => value.toLocaleString()
                      }
                    }
                  }
                }}
                
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Administrative & Other Operating Expnese</Typography>
                <FormControlLabel
                  control={<Switch checked={showZero} onChange={(e) => setShowZero(e.target.checked)} />}
                  label="Show Zero"
                />
              </Box>
              <Bar
                data={ExpensesBreakdownChartData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default Dashboard;