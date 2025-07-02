import React, { useEffect, useState, useRef, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, Paper, CircularProgress, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer,
  FormControlLabel, Switch, Fade, Skeleton, IconButton, Button, Tooltip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { ExpandMore, ChevronRight, UnfoldLess, UnfoldMore } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildTree(records, months, calculateYTD) {
  const lvl1Map = {};
  records.forEach(item => {
    if (!lvl1Map[item.lvl1]) lvl1Map[item.lvl1] = { lvl1: item.lvl1, sub1: item.sub1, lvl2s: {}, YTD: 0, months: {} };
    const lvl1Node = lvl1Map[item.lvl1];
    if (!lvl1Node.lvl2s[item.lvl2]) lvl1Node.lvl2s[item.lvl2] = { lvl2: item.lvl2, sub2: item.sub2, lvl3s: {}, YTD: 0, months: {} };
    const lvl2Node = lvl1Node.lvl2s[item.lvl2];
    if (!lvl2Node.lvl3s[item.lvl3]) lvl2Node.lvl3s[item.lvl3] = { lvl3: item.lvl3, sub_title: item.sub_title, details: [], YTD: 0, months: {} };
    const lvl3Node = lvl2Node.lvl3s[item.lvl3];
    lvl3Node.details.push(item);
  });
  Object.values(lvl1Map).forEach(lvl1 => {
    lvl1.months = months.reduce((acc, m) => { acc[m] = 0; return acc; }, {});
    lvl1.YTD = 0;
    Object.values(lvl1.lvl2s).forEach(lvl2 => {
      lvl2.months = months.reduce((acc, m) => { acc[m] = 0; return acc; }, {});
      lvl2.YTD = 0;
      Object.values(lvl2.lvl3s).forEach(lvl3 => {
        lvl3.months = months.reduce((acc, m) => { acc[m] = 0; return acc; }, {});
        lvl3.YTD = 0;
        lvl3.details.forEach(row => {
          months.forEach(m => {
            lvl3.months[m] += parseFloat(row.values[m] || 0);
            lvl2.months[m] += parseFloat(row.values[m] || 0);
            lvl1.months[m] += parseFloat(row.values[m] || 0);
          });
          lvl3.YTD += calculateYTD(row.values);
          lvl2.YTD += calculateYTD(row.values);
          lvl1.YTD += calculateYTD(row.values);
        });
      });
    });
  });
  return Object.values(lvl1Map).map(lvl1 => ({
    ...lvl1,
    lvl2s: Object.values(lvl1.lvl2s).map(lvl2 => ({
      ...lvl2,
      lvl3s: Object.values(lvl2.lvl3s)
    }))
  }));
}

const ReportPNL = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideZeros, setHideZeros] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [allExpanded, setAllExpanded] = useState(true); // 新增
  const [expanding, setExpanding] = useState(false);

  const timeoutRef = useRef();

  useEffect(() => {
    const fetchPNL = async () => {
      setLoading(true);
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
    if (user?.company_name) fetchPNL();
    return () => clearTimeout(timeoutRef.current);
  }, [user]);

  useEffect(() => {
    if (switching) {
      timeoutRef.current = setTimeout(() => setSwitching(false), 400);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [switching]);

  const calculateYTD = (values) =>
    months.reduce((sum, month) => sum + (parseFloat(values[month]) || 0), 0);

  const visibleRecords = hideZeros
    ? records.filter(item => months.some(month => parseFloat(item.values[month]) !== 0))
    : records;

  const treeData = useMemo(() => buildTree(visibleRecords, months, calculateYTD), [visibleRecords]);
  const overallTotals = useMemo(() => {
    const t = { YTD: 0, ...months.reduce((acc, m) => { acc[m] = 0; return acc; }, {}) };
    visibleRecords.forEach(item => {
      months.forEach(m => { t[m] += parseFloat(item.values[m] || 0); });
      t.YTD += calculateYTD(item.values);
    });
    return t;
  }, [visibleRecords]);

  // ========== 一键展开/收起 ==========
  const getAllExpandableKeys = (tree) => {
    const keys = [];
    tree.forEach(lvl1 => {
      keys.push(lvl1.lvl1);
      lvl1.lvl2s.forEach(lvl2 => {
        keys.push(`${lvl1.lvl1}-${lvl2.lvl2}`);
        lvl2.lvl3s.forEach(lvl3 => {
          keys.push(`${lvl1.lvl1}-${lvl2.lvl2}-${lvl3.lvl3}`);
        });
      });
    });
    return keys;
  };

  const handleExpandCollapseAll = (expand) => {
    setExpanding(true);
    setTimeout(() => {
      const keys = getAllExpandableKeys(treeData);
      const newExpanded = {};
      keys.forEach(k => { newExpanded[k] = expand; });
      setExpanded(newExpanded);
      setAllExpanded(expand);
      setExpanding(false);
    }, 480);
  };

  useEffect(() => {
    const keys = getAllExpandableKeys(treeData);
    if (keys.length === 0) return;
    const expandedCount = keys.filter(k => expanded[k]).length;
    setAllExpanded(expandedCount === keys.length);
  }, [expanded, treeData]);

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  useEffect(() => {
    if (!loading && !switching && Object.keys(expanded).length === 0) {
      const defaultExpanded = {};
      treeData.forEach(lvl1 => { defaultExpanded[lvl1.lvl1] = true; });
      setExpanded(defaultExpanded);
    }
  }, [loading, switching, treeData]);

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 8 }).map((_, idx) => (
        <TableRow key={idx}>
          <TableCell colSpan={15}>
            <Skeleton variant="rectangular" height={28} animation="wave" sx={{ borderRadius: 1 }} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  function renderTree({ lvl1, sub1, lvl2s, YTD, months: m1 }, lvl = 1) {
    const key1 = lvl1;
    const rows = [];
    rows.push(
      <motion.tr key={key1} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <TableCell colSpan={2} sx={{ backgroundColor: '#c8e6c9', fontWeight: 600 }}>
          <IconButton size="small" onClick={() => toggleExpand(key1)}>
            {expanded[key1] ? <ExpandMore /> : <ChevronRight />}
          </IconButton>
          {[`[lvl1-${lvl1}]`, sub1].filter(Boolean).join(' ')}
        </TableCell>
        <TableCell align="right" sx={{ backgroundColor: '#c8e6c9', fontWeight: 600 }}>
          {YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </TableCell>
        {months.map(month => (
          <TableCell key={month} align="right" sx={{ backgroundColor: '#c8e6c9', fontWeight: 600 }}>
            {m1[month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </TableCell>
        ))}
      </motion.tr>
    );
    if (expanded[key1]) {
      lvl2s.forEach(lvl2 => {
        const k2 = `${lvl1}-${lvl2.lvl2}`;
        rows.push(
          <motion.tr key={k2} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TableCell colSpan={2} sx={{ pl: 3, backgroundColor: '#e8f5e9', fontWeight: 500 }}>
              <IconButton size="small" onClick={() => toggleExpand(k2)}>
                {expanded[k2] ? <ExpandMore /> : <ChevronRight />}
              </IconButton>
              {[`[lvl2-${lvl2.lvl2}]`, lvl2.sub2].filter(Boolean).join(' ')}
            </TableCell>
            <TableCell align="right" sx={{ backgroundColor: '#e8f5e9', fontWeight: 500 }}>
              {lvl2.YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </TableCell>
            {months.map(month => (
              <TableCell key={month} align="right" sx={{ backgroundColor: '#e8f5e9', fontWeight: 500 }}>
                {lvl2.months[month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </TableCell>
            ))}
          </motion.tr>
        );
        if (expanded[k2]) {
          lvl2.lvl3s.forEach(lvl3 => {
            const k3 = `${lvl1}-${lvl2.lvl2}-${lvl3.lvl3}`;
            rows.push(
              <motion.tr key={k3} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <TableCell colSpan={2} sx={{ pl: 6, backgroundColor: '#f1f8e9', fontWeight: 500, color: 'gray' }}>
                  <IconButton size="small" onClick={() => toggleExpand(k3)}>
                    {expanded[k3] ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                  {[`[lvl3-${lvl3.lvl3}]`, lvl3.sub_title].filter(Boolean).join(' ')}
                </TableCell>
                <TableCell align="right" sx={{ backgroundColor: '#f1f8e9', fontWeight: 500, color: 'gray' }}>
                  {lvl3.YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                {months.map(month => (
                  <TableCell key={month} align="right" sx={{ backgroundColor: '#f1f8e9', fontWeight: 500, color: 'gray' }}>
                    {lvl3.months[month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                ))}
              </motion.tr>
            );
            if (expanded[k3]) {
              lvl3.details.forEach((item, idx) => {
                rows.push(
                  <motion.tr key={item.gl_code + '_' + idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#fff' }}>{item.gl_code}</TableCell>
                    <TableCell sx={{ position: 'sticky', left: 100, backgroundColor: '#fff' }}>{item.gl_account_long_name}</TableCell>
                    <TableCell align="right">{calculateYTD(item.values).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    {months.map(month => (
                      <TableCell key={month} align="right">
                        {(parseFloat(item.values[month]) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    ))}
                  </motion.tr>
                );
              });
            }
          });
        }
      });
    }
    return rows;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>P&L Report (2025)</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={hideZeros}
              onChange={e => {
                setSwitching(true);
                setHideZeros(e.target.checked);
              }}
              color="primary"
            />
          }
          label="Hide rows with all-zero months"
          sx={{ mr: 2 }}
        />
        <Tooltip title={allExpanded ? 'Collapse all' : 'Expand all'}>
          <Button
            variant="outlined"
            size="small"
            color={allExpanded ? 'secondary' : 'primary'}
            sx={{ ml: 2, minWidth: 128, fontWeight: 600, borderRadius: 2 }}
            startIcon={allExpanded ? <UnfoldLess /> : <UnfoldMore />}
            onClick={() => handleExpandCollapseAll(!allExpanded)}
            disableElevation
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
        </Tooltip>
        <Fade in={switching} unmountOnExit>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="primary.main" fontWeight={500}>Updating view...</Typography>
          </Box>
        </Fade>
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 700, transition: 'box-shadow 0.3s' }}>
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
            {(loading || switching) ? (
              <SkeletonRows />
            ) : (
              treeData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} align="center">
                    <Typography variant="body2" color="text.secondary">No records found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                treeData.map(lvl1Node => renderTree(lvl1Node))
              )
            )}
            {(!loading && !switching) && (
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ backgroundColor: '#dcedc8' }}>
                <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Overall Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{overallTotals.YTD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                {months.map(month => (
                  <TableCell key={month} align="right" sx={{ fontWeight: 'bold' }}>
                    {overallTotals[month].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                ))}
              </motion.tr>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Fade in={expanding} unmountOnExit>
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(255,255,255,0.75)', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'all'
        }}>
          <CircularProgress size={48} sx={{ color: 'primary.main' }} />
          <Typography sx={{ ml: 2, fontWeight: 600, color: 'primary.main' }}>Updating View...</Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default ReportPNL;
