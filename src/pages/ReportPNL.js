// src/pages/ReportPNL.jsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Button
} from '@mui/material';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';

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

  const handleExportRaw = () => {
    const ws = XLSX.utils.json_to_sheet(records.map(row => ({
      'GL Code': row.gl_code,
      'Account Name': row.gl_account_long_name,
      'YTD': months.reduce((sum, m) => sum + (parseFloat(row.values[m]) || 0), 0),
      ...months.reduce((acc, m) => {
        acc[m] = row.values[m];
        return acc;
      }, {})
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PNL Raw');
    XLSX.writeFile(wb, 'PNL_Raw_Report_2025.xlsx');
  };
  const handleExportFormatted = () => {
    const wb = XLSX.utils.book_new();
    const ws_data = [
      ['GL Code', 'Account Name', 'YTD', ...months]
    ];

    let lastLvl1 = null, lastLvl2 = null, lastLvl3 = null;

    const totals = {
      lvl1: {},
      lvl2: {},
      lvl3: {},
      overall: { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) }
    };

    records.forEach(item => {
      const key1 = item.lvl1;
      const key2 = `${item.lvl1}-${item.lvl2}`;
      const key3 = `${item.lvl1}-${item.lvl2}-${item.lvl3}`;

      if (!totals.lvl1[key1]) totals.lvl1[key1] = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };
      if (!totals.lvl2[key2]) totals.lvl2[key2] = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };
      if (!totals.lvl3[key3]) totals.lvl3[key3] = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };

      months.forEach(m => {
        const val = parseFloat(item.values[m]) || 0;
        totals.lvl1[key1][m] += val;
        totals.lvl2[key2][m] += val;
        totals.lvl3[key3][m] += val;
        totals.overall[m] += val;
      });

      totals.lvl1[key1].YTD = calculateYTD(totals.lvl1[key1]);
      totals.lvl2[key2].YTD = calculateYTD(totals.lvl2[key2]);
      totals.lvl3[key3].YTD = calculateYTD(totals.lvl3[key3]);
    });

    records.forEach((item, index) => {
      const key1 = item.lvl1;
      const key2 = `${item.lvl1}-${item.lvl2}`;
      const key3 = `${item.lvl1}-${item.lvl2}-${item.lvl3}`;

      const ytd = calculateYTD(item.values);
      const row = [item.gl_code, item.gl_account_long_name, ytd, ...months.map(m => item.values[m])];
      ws_data.push(row);

      const next = records[index + 1];
      if (!next || next.lvl3 !== item.lvl3) {
        const t = totals.lvl3[key3];
        ws_data.push(['', `Subtotal [lvl3-${item.lvl3}] ${item.sub_title}`, t.YTD, ...months.map(m => t[m])]);
      }
      if (!next || next.lvl2 !== item.lvl2) {
        const t = totals.lvl2[key2];
        ws_data.push(['', `Subtotal [lvl2-${item.lvl2}] ${item.sub2}`, t.YTD, ...months.map(m => t[m])]);
      }
      if (!next || next.lvl1 !== item.lvl1) {
        const t = totals.lvl1[key1];
        ws_data.push(['', `Subtotal [lvl1-${item.lvl1}] ${item.sub1}`, t.YTD, ...months.map(m => t[m])]);
      }
    });

    const t = totals.overall;
    ws_data.push(['', 'Overall Total', t.YTD, ...months.map(m => t[m])]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'PNL Styled');
    XLSX.writeFile(wb, 'PNL_Formatted_Styled_2025.xlsx');
  };



  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading P&L Report...</Typography>
      </Box>
    );
  }

  const calculateYTD = (values) => {
    return months.reduce((sum, month) => sum + (parseFloat(values[month]) || 0), 0);
  };

  let lastLvl1 = null;
  let lastLvl2 = null;
  let lastLvl3 = null;

  const sectionTotals = {};
  const lvl2Totals = {};
  const lvl1Totals = {};
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
    sectionTotals[key3].YTD = months.reduce((sum, m) => sum + sectionTotals[key3][m], 0);
    lvl2Totals[key2].YTD = months.reduce((sum, m) => sum + lvl2Totals[key2][m], 0);
    lvl1Totals[key1].YTD = months.reduce((sum, m) => sum + lvl1Totals[key1][m], 0);
    overallTotals.YTD += months.reduce((sum, m) => parseFloat(item.values[m] || 0) + sum, 0);
  });

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">P&L Report (2025)</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleExportRaw} variant="outlined">Export Raw</Button>
          <Button onClick={handleExportFormatted} variant="contained">Export Formatted</Button>
        </Box>
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 700, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: '#fafafa' }}>GL Code</TableCell>
              <TableCell sx={{ position: 'sticky', left: 100, zIndex: 2, backgroundColor: '#fafafa' }}>Account Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>YTD</TableCell>
              {months.map(month => (
                <TableCell key={month} align="right">{month}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((item, index) => {
              const showSub1 = item.lvl1 !== lastLvl1;
              const showSub2 = item.lvl2 !== lastLvl2;
              const showSub3 = item.lvl3 !== lastLvl3;
              const key3 = `${item.lvl1}-${item.lvl2}-${item.lvl3}`;
              const key2 = `${item.lvl1}-${item.lvl2}`;
              const key1 = `${item.lvl1}`;
              lastLvl1 = item.lvl1;
              lastLvl2 = item.lvl2;
              lastLvl3 = item.lvl3;

              return (
                <React.Fragment key={`${item.gl_code}_${index}`}>
                  {showSub1 && (
                    <TableRow>
                      <TableCell colSpan={15} sx={{ backgroundColor: '#c8e6c9', fontWeight: 600 }}>{`[lvl1-${item.lvl1}] ${item.sub1}`}</TableCell>
                    </TableRow>
                  )}
                  {showSub2 && (
                    <TableRow>
                      <TableCell colSpan={15} sx={{ pl: 2, backgroundColor: '#e8f5e9', fontWeight: 500 }}>{`[lvl2-${item.lvl2}] ${item.sub2}`}</TableCell>
                    </TableRow>
                  )}
                  {showSub3 && (
                    <TableRow>
                      <TableCell colSpan={15} sx={{ pl: 4, backgroundColor: '#f1f8e9', color: 'gray', fontWeight: 500 }}>{`[lvl3-${item.lvl3}] ${item.sub_title}`}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#fff' }}>{item.gl_code}</TableCell>
                    <TableCell sx={{ position: 'sticky', left: 100, backgroundColor: '#fff' }}>{item.gl_account_long_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{calculateYTD(item.values).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    {months.map(month => (
                      <TableCell key={month} align="right">
                        {parseFloat(item.values?.[month] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                  </TableRow>
                  {(records[index + 1]?.lvl3 !== item.lvl3 || !records[index + 1]) && (
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
                  {(records[index + 1]?.lvl2 !== item.lvl2 || !records[index + 1]) && (
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
                  {(records[index + 1]?.lvl1 !== item.lvl1 || !records[index + 1]) && (
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
