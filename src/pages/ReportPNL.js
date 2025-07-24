import React, { useEffect, useState, useRef, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, Paper, CircularProgress, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer,
  FormControlLabel, Switch, Fade, Skeleton, IconButton, Button, Tooltip, Stack,
  FormControl, InputLabel, Select, MenuItem, Checkbox, Menu, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TableSortLabel
} from '@mui/material';
import { useSelector } from 'react-redux';
import { ExpandMore, ChevronRight, UnfoldLess, UnfoldMore } from '@mui/icons-material';
import { motion } from 'framer-motion';

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
  return Object.values(lvl1Map)
    .sort((a, b) => a.lvl1 - b.lvl1)
    .map(lvl1 => lvl1.isFormula ? lvl1 : {
      ...lvl1,
      lvl2s: Object.values(lvl1.lvl2s).map(lvl2 => ({
        ...lvl2,
        lvl3s: Object.values(lvl2.lvl3s)
      }))
    });
}

const ReportPNL = () => {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideZeros, setHideZeros] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [currencyInfo, setCurrencyInfo] = useState(null);
  const [currencyMode, setCurrencyMode] = useState('base');
  const [valueScale, setValueScale] = useState('normal'); // 可为 'normal' | 'thousand' | 'million'
  const [availableProfitCenters, setAvailableProfitCenters] = useState([]);
  const [availableCostCenters, setAvailableCostCenters] = useState([]);

  const [selectedProfitCenters, setSelectedProfitCenters] = useState([]);
  const [selectedCostCenters, setSelectedCostCenters] = useState([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecords, setDetailRecords] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailParams, setDetailParams] = useState(null);



  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('cost_center');

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);


  const timeoutRef = useRef();

  useEffect(() => {
    const initStructure = async () => {
      if (user?.cost_center !== 'FIN&CORP') return;

      try {
        const structureRes = await axiosInstance.get('/report/company-structure');
        const pcs = structureRes.data.profit_centers || [];
        const ccs = structureRes.data.cost_centers || [];

        setAvailableProfitCenters(pcs);
        setAvailableCostCenters(ccs);

        setSelectedProfitCenters(pcs); // 默认全选
        setSelectedCostCenters(ccs);   // 默认全选
      } catch (err) {
        console.error('❌ Failed to load structure:', err);
      }
    };

    initStructure();
  }, [user]);
  useEffect(() => {
    const loadPNL = async () => {
      if (!user) return;

      const isFINCORP = user.cost_center === 'FIN&CORP';

      let profit_centers = [];
      let cost_centers = [];

      if (isFINCORP) {
        profit_centers = selectedProfitCenters;
        cost_centers = selectedCostCenters;

        if (profit_centers.length === 0 && cost_centers.length === 0) return;
      } else {
        cost_centers = [user.cost_center_name];
      }

      setLoading(true);
      try {
        const res = await axiosInstance.get('/report/pnl', {
          params: {
            glyear: 2025,
            profit_centers,
            cost_centers,
            _: Date.now()
          }
        });
        setRecords(res.data.data || []);
        setCurrencyInfo(res.data.currency_info || null);
      } catch (err) {
        console.error('❌ Failed to load PNL:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPNL();
  }, [user, selectedProfitCenters, selectedCostCenters]);


  useEffect(() => {
    if (switching) {
      timeoutRef.current = setTimeout(() => setSwitching(false), 400);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [switching]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedDetailRecords = useMemo(() => {
    return [...detailRecords].sort((a, b) => {
      const aValue = orderBy === 'amount' ? parseFloat(a[orderBy]) : (a[orderBy] || '');
      const bValue = orderBy === 'amount' ? parseFloat(b[orderBy]) : (b[orderBy] || '');

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [detailRecords, order, orderBy]);


  const convertCurrency = (value) => {
    if (!currencyInfo || currencyMode === 'user') return value;
    return value / (currencyInfo.rate || 1);
  };

  const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const allSelected = selected.length === options.length;

    const handleToggle = (value) => {
      const current = selected.includes(value);
      const newSelected = current
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onChange(newSelected);
    };

    const handleSelectAllToggle = () => {
      if (allSelected) {
        onChange([]);
      } else {
        onChange(options);
      }
    };

    return (
      <>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ minWidth: 180, textTransform: 'none' }}
        >
          {allSelected ? `All ${label}` : `${selected.length} ${label}`}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ style: { maxHeight: 300, width: 240 } }}
        >
          <MenuItem onClick={handleSelectAllToggle}>
            <Checkbox checked={allSelected} />
            <ListItemText primary="Select All" />
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option} onClick={() => handleToggle(option)}>
              <Checkbox checked={selected.includes(option)} />
              <ListItemText primary={option} />
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  };

  const ProfitAndCostFilter = ({
    profitCenters = [],
    costCenters = [],
    selectedProfitCenters = [],
    selectedCostCenters = [],
    onChange = () => { }
  }) => {
    return (
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <MultiSelectDropdown
          label="Profit Centers"
          options={profitCenters}
          selected={selectedProfitCenters}
          onChange={(newProfits) => onChange(newProfits, selectedCostCenters)}
        />
        <MultiSelectDropdown
          label="Cost Centers"
          options={costCenters}
          selected={selectedCostCenters}
          onChange={(newCosts) => onChange(selectedProfitCenters, newCosts)}
        />
      </Stack>
    );
  };

  const calculateYTD = (values) =>
    months.reduce((sum, month) => sum + (parseFloat(values[month]) || 0), 0);

  const visibleRecords = hideZeros
    ? records.filter(item => months.some(month => parseFloat(item.values[month]) !== 0))
    : records;

  const treeData = useMemo(() => buildTree(visibleRecords, months, calculateYTD), [visibleRecords]);

  const showCurrencySwitch = currencyInfo && currencyInfo.base_currency !== currencyInfo.user_currency;

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

  const convertAndScaleValue = (value) => {
    const converted = convertCurrency(value); // 先做 currency conversion
    switch (valueScale) {
      case 'million': return converted / 1_000_000;
      case 'thousand': return converted / 1_000;
      default: return converted;
    }
  };



  useEffect(() => {
    const keys = getAllExpandableKeys(treeData);
    if (keys.length === 0) return;
    const expandedCount = keys.filter(k => expanded[k]).length;
    setAllExpanded(expandedCount === keys.length);
  }, [expanded, treeData]);

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  // useEffect(() => {
  //   if (!loading && !switching && Object.keys(expanded).length === 0) {
  //     const defaultExpanded = {};
  //     treeData.forEach(lvl1 => { defaultExpanded[lvl1.lvl1] = true; });
  //     setExpanded(defaultExpanded);
  //   }
  // }, [loading, switching, treeData]);

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

    const isFormulaRow = !Number.isInteger(parseFloat(lvl1));

    const colorLvl1 = isFormulaRow ? '#FFF8DB' : '#EAE6FA';
    const colorLvl2 = '#cfe2f3';
    const colorLvl3 = '#e6f0fa';

    rows.push(
      <motion.tr key={key1} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <TableCell colSpan={2} sx={{ backgroundColor: colorLvl1, fontWeight: 600 }}>
          {!isFormulaRow && (
            <IconButton size="small" onClick={() => toggleExpand(key1)}>
              {expanded[key1] ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          )}
          {[sub1].filter(Boolean).join(' ')}
        </TableCell>
        <TableCell
          align="right"
          onClick={!isFormulaRow ? () =>
            handleCellClick({
              type: 'lvl1',
              lvl1,
              month: "YTD",
              sub1
            }) : undefined}
          sx={{
            backgroundColor: colorLvl1,
            fontWeight: 800,
            cursor: !isFormulaRow ? 'pointer' : 'default',
            '&:hover': !isFormulaRow ? { textDecoration: 'underline' } : undefined
          }}
        >
          {convertAndScaleValue(YTD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </TableCell>
        {months.map(month => (
          <TableCell
            key={month}
            align="right"
            onClick={!isFormulaRow ? () =>
              handleCellClick({
                type: 'lvl1',
                lvl1,
                month,
                sub1
              }) : undefined}
            sx={{
              backgroundColor: colorLvl1,
              fontWeight: 600,
              cursor: !isFormulaRow ? 'pointer' : 'default',
              '&:hover': !isFormulaRow ? { textDecoration: 'underline' } : undefined
            }}
          >
            {convertAndScaleValue(m1[month]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </TableCell>
        ))}
      </motion.tr>

    );

    if (expanded[key1] && !isFormulaRow) {
      lvl2s.forEach(lvl2 => {
        const k2 = `${lvl1}-${lvl2.lvl2}`;
        rows.push(
          <motion.tr key={k2} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TableCell colSpan={2} sx={{ pl: 3, backgroundColor: colorLvl2, fontWeight: 500 }}>
              <IconButton size="small" onClick={() => toggleExpand(k2)}>
                {expanded[k2] ? <ExpandMore /> : <ChevronRight />}
              </IconButton>
              {[lvl2.sub2].filter(Boolean).join(' ')}
            </TableCell>
            <TableCell align="right"
              onClick={() =>
                handleCellClick({
                  type: 'lvl2',
                  lvl1, lvl2: lvl2,
                  month: "YTD",
                  sub1
                })} sx={{ backgroundColor: colorLvl2, fontWeight: 800, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              {convertAndScaleValue(lvl2.YTD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
            {months.map(month => (
              <TableCell key={month} align="right"
                onClick={() =>
                  handleCellClick({
                    type: 'lvl2',
                    lvl1, lvl2: lvl2,
                    month,
                    sub1
                  })}
                sx={{ backgroundColor: colorLvl2, fontWeight: 500, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} >
                {convertAndScaleValue(lvl2.months[month]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
            ))
            }
          </motion.tr >
        );
        if (expanded[k2]) {
          lvl2.lvl3s.forEach(lvl3 => {
            const k3 = `${lvl1}-${lvl2.lvl2}-${lvl3.lvl3}`;
            rows.push(
              <motion.tr key={k3} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <TableCell colSpan={2} sx={{ pl: 6, backgroundColor: colorLvl3, fontWeight: 500 }}>
                  <IconButton size="small" onClick={() => toggleExpand(k3)}>
                    {expanded[k3] ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                  {[lvl3.sub_title].filter(Boolean).join(' ')}
                </TableCell>
                <TableCell align="right"
                  onClick={() =>
                    handleCellClick({
                      type: 'lvl3',
                      lvl1, lvl2, lvl3,
                      month: "YTD",
                      sub1
                    })}
                  sx={{ backgroundColor: colorLvl3, fontWeight: 800, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {convertAndScaleValue(lvl3.YTD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                {months.map(month => (
                  <TableCell key={month} align="right"
                    onClick={() =>
                      handleCellClick({
                        type: 'lvl3',
                        lvl1, lvl2, lvl3,
                        month,
                        sub1
                      })}
                    sx={{ backgroundColor: colorLvl3, fontWeight: 500, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {convertAndScaleValue(lvl3.months[month]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                ))}
              </motion.tr>
            );

            if (expanded[k3]) {
              lvl3.details.forEach((item, idx) => {
                rows.push(
                  <motion.tr key={item.gl_code + '_' + idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: '#ffffff' }}>{item.gl_code}</TableCell>
                    <TableCell sx={{ position: 'sticky', left: 100, backgroundColor: '#ffffff' }}>{item.gl_account_long_name}</TableCell>
                    <TableCell align="right"
                      onClick={() =>
                        handleCellClick({
                          type: 'gl',
                          gl_code: item.gl_code,
                          lvl1, lvl2, lvl3,
                          month: 'YTD',
                          sub1
                        })}
                      sx={{ backgroundColor: '#ffffff', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {convertAndScaleValue(calculateYTD(item.values)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    {months.map(month => (
                      <TableCell key={month} align="right"
                        onClick={() =>
                          handleCellClick({
                            type: 'gl',
                            gl_code: item.gl_code,
                            lvl1, lvl2, lvl3,
                            month,
                            sub1
                          })}
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {convertAndScaleValue((parseFloat(item.values[month])) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const handleCellClick = async ({ type, gl_code, lvl1, lvl2, lvl3, month,sub1 }) => {
    if (user?.cost_center !== 'FIN&CORP') return;

    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailParams({ type, gl_code, lvl1, lvl2, lvl3, month, sub1 });

    // 构建请求参数
    const params = {
      year: 2025,
      month,
      type,
      profit_centers: selectedProfitCenters,
      cost_centers: selectedCostCenters
    };

    if (type === 'gl' && gl_code) {
      params.gl_code = gl_code;
    }

    if (lvl1 !== undefined) params.lvl1 = lvl1;
    if (lvl2 !== undefined) params.lvl2 = lvl2.lvl2;
    if (lvl3 !== undefined) params.lvl3 = lvl3.lvl3;

    try {
      const res = await axiosInstance.get('/report/details', { params });
      setDetailRecords(res.data?.records || []);
    } catch (err) {
      console.error('❌ Failed to fetch detail records:', err);
      setDetailRecords([]);
    } finally {
      setDetailLoading(false);
    }
  };




  return (
    <>
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            backgroundColor: '#e6ebf0',
            fontWeight: 600,
            fontSize: '1.1rem',
            color: '#3a3f4a'
          }}
        >
          {(() => {
            const monthLabel = detailParams?.month === 'YTD' ? 'YTD' : detailParams?.month;
            const type = detailParams?.type;

            if (type === 'gl') {
              return `Title: ${detailParams?.gl_code} - ${detailRecords?.[0]?.gl_account_long_name || ''} (${monthLabel})`;
            }

            if (type === 'lvl3') {
              return `Title: ${detailParams?.lvl3?.sub_title || ''} (${monthLabel})`;
            }

            if (type === 'lvl2') {
              return `Title: ${detailParams?.lvl2?.sub2 || ''} (${monthLabel})`;
            }

            if (type === 'lvl1') {
              return `Title: ${detailParams?.sub1 || ''} (${monthLabel})`;
            }

            return `Details for ${monthLabel}`;
          })()}
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: '#f8f9fa', px: 2, py: 2 }}>
          {detailLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detailRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No records found.</Typography>
          ) : (
            <>
              <Box
                sx={{
                  mb: 1,
                  textAlign: 'right',
                  pr: 2,
                  py: 1,
                  backgroundColor: '#dbe4dc',
                  borderRadius: 1
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                  Total: {detailRecords.reduce((sum, rec) => sum + (parseFloat(rec.amount) || 0), 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2
                  })}
                </Typography>
              </Box>
              <Table size="small" sx={{
                border: '1px solid #cfd8dc',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <TableHead sx={{ backgroundColor: '#d7dee4' }}>
                  <TableRow>
                    <TableCell sortDirection={orderBy === 'cost_center' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'cost_center'}
                        direction={orderBy === 'cost_center' ? order : 'asc'}
                        onClick={() => handleSort('cost_center')}
                      >
                        Cost Center
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === 'gl_code' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'gl_code'}
                        direction={orderBy === 'gl_code' ? order : 'asc'}
                        onClick={() => handleSort('gl_code')}
                      >
                        GL Code
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sortDirection={orderBy === 'amount' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'amount'}
                        direction={orderBy === 'amount' ? order : 'asc'}
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedDetailRecords.map((rec, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ color: '#495057' }}>{rec.cost_center}</TableCell>
                      <TableCell sx={{ color: '#495057' }}>
                        {rec.gl_code} - {rec.gl_account_long_name || ''}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#495057' }}>
                        {parseFloat(rec.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#f1f3f4', px: 3, py: 2 }}>
          <Button
            onClick={() => setDetailModalOpen(false)}
            sx={{
              backgroundColor: '#c4c9cc',
              color: '#333',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#b0b5b8'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>



      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>P&L Report (2025)</Typography>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center">
            {/* ✅ Zero Filter */}
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
            />

            {/* ✅ Currency Switch */}
            {currencyInfo && showCurrencySwitch && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currencyMode === 'user'}
                      onChange={e => setCurrencyMode(e.target.checked ? 'user' : 'base')}
                      color="primary"
                    />
                  }
                  label={`Show in ${currencyMode === 'base' ? currencyInfo.base_currency : currencyInfo.user_currency}`}
                />
                <Typography variant="body2" color="text.secondary">
                  1 {currencyInfo.base_currency} = {currencyInfo.rate.toFixed(2)} {currencyInfo.user_currency}
                </Typography>
              </>
            )}

            {/* ✅ Expand / Collapse */}
            <Tooltip title={allExpanded ? 'Collapse all' : 'Expand all'}>
              <Button
                variant="outlined"
                size="small"
                color={allExpanded ? 'secondary' : 'primary'}
                sx={{ minWidth: 128, fontWeight: 600, borderRadius: 2 }}
                startIcon={allExpanded ? <UnfoldLess /> : <UnfoldMore />}
                onClick={() => handleExpandCollapseAll(!allExpanded)}
                disableElevation
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            </Tooltip>

            {user?.cost_center === 'FIN&CORP' && (
              <>
                {user?.cost_center === 'FIN&CORP' && (
                  <ProfitAndCostFilter
                    profitCenters={availableProfitCenters}
                    costCenters={availableCostCenters}
                    selectedProfitCenters={selectedProfitCenters}
                    selectedCostCenters={selectedCostCenters}
                    onChange={(profits, costs) => {
                      setSelectedProfitCenters(profits);
                      setSelectedCostCenters(costs);
                    }}
                  />
                )}

              </>
            )}


            {/* ✅ Display Unit Selector */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="value-scale-label">Display Unit</InputLabel>
              <Select
                labelId="value-scale-label"
                value={valueScale}
                label="Display Unit"
                onChange={(e) => setValueScale(e.target.value)}
              >
                <MenuItem value="normal">None</MenuItem>
                <MenuItem value="thousand">Thousands</MenuItem>
                <MenuItem value="million">Millions</MenuItem>
              </Select>
            </FormControl>

            {/* ✅ Loading Fade-in */}
            <Fade in={switching} unmountOnExit>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="primary.main" fontWeight={500}>Updating view...</Typography>
              </Box>
            </Fade>
          </Stack>
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
    </>
  );
};

export default ReportPNL;
