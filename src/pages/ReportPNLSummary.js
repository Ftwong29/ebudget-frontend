import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableRow
} from '@mui/material';
import { useSelector } from 'react-redux';

const format = (val) => val?.toLocaleString('en-MY', { minimumFractionDigits: 2 });

const summaryStructure = [
  { label: 'REVENUE', key: 'revenue' },
  { label: '  TOTAL PRE-NEED SALES', key: 'total_pre_need_sales' },
  { label: '  TOTAL AS-NEED SALES', key: 'total_as_need_sales' },

  { label: 'COST OF SALES', key: 'cost_of_sales' },
  { label: '  TOTAL PRE-NEED COST OF SALES', key: 'total_pre_need_cost_of_sales' },
  { label: '  TOTAL AS-NEED COST OF SALES', key: 'total_as_need_cost_of_sales' },
  { label: '  TOTAL COST OF SALES', key: 'total_cost_of_sales' },

  { label: 'GROSS PROFIT', key: 'gross_profit' },

  { label: 'NON-OPERATING INCOME', key: 'non_operating_income' },
  { label: '  TOTAL SELLING & DISTRIBUTION EXPENSE', key: 'total_selling_distribution_expenses' },
  { label: '  TOTAL ADMIN & OTHER OPERATING EXPENSE', key: 'total_administrative_other_operating' },

  { label: 'TOTAL OPERATING EXPENSE', key: 'total_operating_expense' },
  { label: 'PROFIT BEFORE INTEREST & TAX', key: 'profit_before_interest_tax' },
  { label: 'DEPRECIATION EXPENSES', key: 'depreciation_expenses' },
  { label: 'PROFIT FROM OPERATING', key: 'profit_from_operating' },
  { label: 'FINANCE COST', key: 'finance_cost' },
  { label: 'PROFIT BEFORE TAXATION', key: 'profir_before_taxtation' },
  { label: 'TAX EXPENSES', key: 'tax_expenses' },
  { label: 'NET PROFIT AFTER TAX', key: 'net_profit_after_tax' },
  { label: 'SHARE ON PROFIT / LOSS', key: 'share_on_profit_loss' },
  { label: 'OTHER COMPREHENSIVE INCOME', key: 'other_comprehensive_income_loss' },
  { label: 'DIVIDEND EXPENSE', key: 'dividend_expense' },
  { label: 'CHANGES IN RETAINED EARNING', key: 'changes_in_retained_earning' },
  { label: 'RETAINED PROFIT CARRIED FORWARD', key: 'retained_profit_carried_forward' },
];

const ReportPNLSummary = () => {
  const { user } = useSelector((state) => state.auth);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosInstance.get('/report/pnl-summary', {
          params: {
            glyear: 2025,
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
  }, [user]);

  if (loading) return <CircularProgress sx={{ mt: 5 }} />;

  return (
    <Box p={3} sx={{ backgroundColor: '#f4f3f1', minHeight: '100vh' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#5f6560', fontWeight: 'bold' }}>
        PNL Summary Report - {user?.company_name}
      </Typography>
      <TableContainer component={Paper} sx={{ maxWidth: 900, borderRadius: 3, overflow: 'hidden', backgroundColor: '#faf9f7' }}>
        <Table size="small">
          <TableBody>
            {summaryStructure.map(({ key, label }) => (
              <TableRow
                key={key}
                sx={{
                  backgroundColor: label.startsWith('  ')
                    ? 'inherit'
                    : '#e3e0db',
                }}
              >
                <TableCell
                  sx={{
                    pl: label.startsWith('  ') ? 4 : 2,
                    fontWeight: label.startsWith('  ') ? 400 : 600,
                    color: label.startsWith('  ') ? '#555' : '#3e3f3a',
                    fontSize: label.startsWith('  ') ? 14 : 15,
                    borderBottom: '1px solid #ddd'
                  }}
                >
                  {label.trim()}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: '#37474f',
                    fontSize: 14,
                    borderBottom: '1px solid #ddd'
                  }}
                >
                  {format(summary?.[key] || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportPNLSummary;
