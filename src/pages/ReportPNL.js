// ✅ Fixed version of ReportPNL with proper header grouping logic

import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, Paper, CircularProgress, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer
} from '@mui/material';
import { useSelector } from 'react-redux';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ReportPNL = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPNL = async () => {
      try {
        const res = await axiosInstance.get('/report/pnl', {
          params: {
            glyear: 2025,
            company: user?.company_name,
            _: Date.now()
          }
        });
        setRecords(res.data.data || []);
      } catch (err) {
        console.error('Failed to load PNL report:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_name) {
      fetchPNL();
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading P&L Report...</Typography>
      </Box>
    );
  }

  const calculateYTD = (values) =>
    months.reduce((sum, month) => sum + (parseFloat(values[month]) || 0), 0);

  const sectionTotals = {}, lvl2Totals = {}, lvl1Totals = {};
  const overallTotals = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };

  records.forEach(item => {
    const key3 = `${item.lvl1}-${item.lvl2}-${item.lvl3}`;
    const key2 = `${item.lvl1}-${item.lvl2}`;
    const key1 = `${item.lvl1}`;

    if (!sectionTotals[key3]) sectionTotals[key3] = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };
    if (!lvl2Totals[key2]) lvl2Totals[key2] = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };
    if (!lvl1Totals[key1]) lvl1Totals[key1] = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };

    months.forEach(m => {
      const val = parseFloat(item.values[m] || 0);
      sectionTotals[key3][m] += val;
      lvl2Totals[key2][m] += val;
      lvl1Totals[key1][m] += val;
      overallTotals[m] += val;
    });

    sectionTotals[key3].YTD = calculateYTD(sectionTotals[key3]);
    lvl2Totals[key2].YTD = calculateYTD(lvl2Totals[key2]);
    lvl1Totals[key1].YTD = calculateYTD(lvl1Totals[key1]);
    overallTotals.YTD += calculateYTD(item.values);
  });

  let lastLvl1 = '', lastLvl2 = '', lastLvl3 = '';

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>P&L Report (2025)</Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 700 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#fafafa' }}>GL Code</TableCell>
              <TableCell sx={{ position: 'sticky', left: 100, zIndex: 2, backgroundColor: '#fafafa' }}>Account Name</TableCell>
              <TableCell align="right">YTD</TableCell>
              {months.map(month => (
                <TableCell key={month} align="right">{month}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {records.map((item, index) => {
              const showSub1 = item.lvl1 !== lastLvl1;
              const showSub2 = item.lvl2 !== lastLvl2 || item.lvl1 !== lastLvl1;
              const showSub3 = item.lvl3 !== lastLvl3 || item.lvl2 !== lastLvl2 || item.lvl1 !== lastLvl1;

              lastLvl1 = item.lvl1;
              lastLvl2 = item.lvl2;
              lastLvl3 = item.lvl3;

              const key1 = `${item.lvl1}`;
              const key2 = `${item.lvl1}-${item.lvl2}`;
              const key3 = `${item.lvl1}-${item.lvl2}-${item.lvl3}`;

              return (
                <React.Fragment key={`${item.gl_code}_${index}`}>
                  {showSub1 && (
                    <TableRow><TableCell colSpan={15} sx={{ backgroundColor: '#c8e6c9', fontWeight: 600 }}>{`[lvl1-${item.lvl1}] ${item.sub1}`}</TableCell></TableRow>
                  )}
                  {showSub2 && (
                    <TableRow><TableCell colSpan={15} sx={{ pl: 2, backgroundColor: '#e8f5e9', fontWeight: 500 }}>{`[lvl2-${item.lvl2}] ${item.sub2}`}</TableCell></TableRow>
                  )}
                  {showSub3 && (
                    <TableRow><TableCell colSpan={15} sx={{ pl: 4, backgroundColor: '#f1f8e9', fontWeight: 500, color: 'gray' }}>{`[lvl3-${item.lvl3}] ${item.sub_title}`}</TableCell></TableRow>
                  )}

                  <TableRow>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#fff' }}>{item.gl_code}</TableCell>
                    <TableCell sx={{ position: 'sticky', left: 100, backgroundColor: '#fff' }}>{item.gl_account_long_name}</TableCell>
                    <TableCell align="right">{calculateYTD(item.values).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    {months.map(month => (
                      <TableCell key={month} align="right">
                        {(parseFloat(item.values[month]) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                  </TableRow>

                  {(records[index + 1]?.lvl3 !== item.lvl3) && (
                    <TableRow sx={{ backgroundColor: '#f9fbe7' }}>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>{`Subtotal [lvl3-${item.lvl3}] ${item.sub_title}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{sectionTotals[key3].YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      {months.map(month => (
                        <TableCell key={month} align="right">
                          {sectionTotals[key3][month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {(records[index + 1]?.lvl2 !== item.lvl2) && (
                    <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>{`Subtotal [lvl2-${item.lvl2}] ${item.sub2}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{lvl2Totals[key2].YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      {months.map(month => (
                        <TableCell key={month} align="right">
                          {lvl2Totals[key2][month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {(records[index + 1]?.lvl1 !== item.lvl1) && (
                    <TableRow sx={{ backgroundColor: '#bbdefb' }}>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>{`Subtotal [lvl1-${item.lvl1}] ${item.sub1}`}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{lvl1Totals[key1].YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      {months.map(month => (
                        <TableCell key={month} align="right">
                          {lvl1Totals[key1][month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            <TableRow sx={{ backgroundColor: '#dcedc8' }}>
              <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Overall Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{overallTotals.YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
              {months.map(month => (
                <TableCell key={month} align="right" sx={{ fontWeight: 'bold' }}>
                  {overallTotals[month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportPNL;
