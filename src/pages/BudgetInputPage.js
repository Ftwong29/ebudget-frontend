// ✅ 最终合并后的 BudgetInputPage.jsx（含 Related 分类下拉逻辑 + Dialog Dropdown）

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Typography, TextField, Paper, Accordion, AccordionSummary, AccordionDetails,
  Grid, Dialog, DialogActions, DialogContent, DialogTitle, Button, Tabs, Tab, CircularProgress, Snackbar
  , Autocomplete
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector } from 'react-redux';
import CryptoJS from 'crypto-js';

const secretKey = process.env.REACT_APP_SECRET_KEY;
const budgetCategories = ['Sales', 'Cost', 'NonOperating', 'Direct', 'Indirect', 'Manpower', 'Related'];

const BudgetInputPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [glItems, setGlItems] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [previousValues, setPreviousValues] = useState({});
  const [relatedValues, setRelatedValues] = useState({});
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(budgetCategories[0]);
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [recalculateFlag, setRecalculateFlag] = useState(false);

  const [groupedCompanies, setGroupedCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [availableProfitCenters, setAvailableProfitCenters] = useState([]);
  const [selectedProfitCenter, setSelectedProfitCenter] = useState('');
  const [currentGlCode, setCurrentGlCode] = useState('');


  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleInputChange = useCallback((glCode, month, value) => {
    setInputValues((prev) => ({
      ...prev,
      [glCode]: {
        ...prev[glCode],
        [month]: value
      }
    }));
  }, []);

  const hasUnsavedChanges = () => JSON.stringify(inputValues) !== JSON.stringify(initialValues);

  const groupedItems = useMemo(() => {
    const result = {};
    for (const item of glItems) {
      const { sub2, sub_title } = item;
      if (!result[sub2]) result[sub2] = {};
      if (!result[sub2][sub_title]) result[sub2][sub_title] = [];
      result[sub2][sub_title].push(item);
    }
    return result;
  }, [glItems, recalculateFlag]);

  const calculateItemTotal = (glCode, source = inputValues) => months.reduce((total, month) => {
    const val = parseFloat(source[glCode]?.[month] || 0);
    return total + (isNaN(val) ? 0 : val);
  }, 0);

  const calculateGroupTotal = (items, source = inputValues) => items.reduce((total, item) => total + calculateItemTotal(item.gl_code, source), 0);

  const calculateSub2Total = (subTitles, source = inputValues) => Object.values(subTitles).reduce((total, items) => total + calculateGroupTotal(items, source), 0);

  const calculateGrandTotal = (source = inputValues) => Object.values(groupedItems).reduce((total, subTitles) => total + calculateSub2Total(subTitles, source), 0);

  const grandTotal = useMemo(() => calculateGrandTotal(), [inputValues, groupedItems]);
  const prevGrandTotal = useMemo(() => calculateGrandTotal(previousValues), [previousValues, groupedItems]);

  const formatNumber = (number) => number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadSavedValues = async (category) => {
    try {
      const res = await axiosInstance.get(`/gl/glinput-load`, {
        params: { branch: user.cost_center_id, glyear: 2025, category: category.toLowerCase() }
      });
      const { current = {}, previous = {}, savedAt = null } = res.data;
      setInputValues(current);
      setInitialValues(current);
      setPreviousValues(previous);
      setLastSavedAt(savedAt);
    } catch (err) {
      console.error('❌ Failed to load saved values:', err);
    }
  };

  const fetchGLData = async (category) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/gl/glinput-category`, {
        params: { category: category.toLowerCase() }
      });

      if (category.toLowerCase() === 'related') {
        const { glItems, groupedData } = res.data;
        setGlItems(glItems);
        setGroupedCompanies(groupedData);
        setSelectedCompany('');
        setAvailableProfitCenters([]);
        setSelectedProfitCenter('');
      } else {
        setGlItems(res.data.glItems || res.data);
      }
      await loadSavedValues(category);
    } catch (err) {
      console.error('❌ Failed to load GL items:', err);
    } finally {
      setLoading(false);
      setRecalculateFlag(prev => !prev);
    }
  };

  useEffect(() => {
    if (user) fetchGLData(selectedCategory);
  }, [selectedCategory, user]);

  useEffect(() => {
    const filtered = groupedCompanies.filter(g => g.company_name === selectedCompany);
    let profitCenters = filtered.map(g => g.profit_center);

    if (profitCenters.length === 1) {
      setAvailableProfitCenters(profitCenters);
      setSelectedProfitCenter(profitCenters[0]);
      handleProfitCenterChange(profitCenters[0], currentGlCode)

    } else if (profitCenters.length > 1) {
      const allOption = 'ALL';
      profitCenters = [allOption, ...profitCenters];
      setAvailableProfitCenters(profitCenters);
      setSelectedProfitCenter(allOption);

      handleProfitCenterChange(profitCenters[0], currentGlCode)
    } else {
      setAvailableProfitCenters([]);
      setSelectedProfitCenter('');
    }
  }, [selectedCompany, groupedCompanies]);



  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [inputValues, initialValues]);


  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setCurrentGlCode(item.gl_code.toString());
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedItem(null);
    setRecalculateFlag(prev => !prev);
    setCurrentGlCode('')
    setAvailableProfitCenters([])
    setSelectedProfitCenter("")
    setSelectedCompany('');
  };

  const handleCategoryChange = (event, newCategory) => {
    if (hasUnsavedChanges()) {
      const confirmSwitch = window.confirm("You have unsaved changes. Do you want to switch category without saving?");
      if (!confirmSwitch) return;
    }
    setSelectedCategory(newCategory);
  };

  const handleSave = async () => {
    try {

      const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify({
        glyear: 2025,
        currency: user?.currency || 'N/A',
        values: inputValues
      }), secretKey).toString();
      
      await axiosInstance.post(`/gl/glinput-save`, { data: encryptedPayload });
      
      setInitialValues(inputValues);
      setLastSavedAt(new Date());
      setSnackbarOpen(true);
    } catch (err) {
      alert('Failed to save: ' + (err?.response?.data?.message || err.message));
    }
  };


  const handleProfitCenterChange = async (value: string, glCode?: string) => {
    setSelectedProfitCenter(value);
    setLoading(true);
    try {
      const res = await axiosInstance.post('/gl/glinput-load-related', {
        glyear: 2025,
        company: selectedCompany,
        profitCenter: value,
        glcode: glCode?.toString()
      });
      // ✅ 将返回的 related current 值保存
      if (res.data?.current) {
        setRelatedValues(res.data.current);
      } else {
        setRelatedValues({});
      }

    } catch (err) {
      console.error(err);
      setRelatedValues({});
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  if (!user) return <Box sx={{ padding: 4 }}><Typography>Loading user info...</Typography></Box>;

  return (
    <Box sx={{ padding: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">Budget Input: {selectedCategory} (2025)</Typography>
      <Typography variant="body2">Branch: {user.branchcode2}</Typography>
      {lastSavedAt && <Typography variant="body2" sx={{ mb: 1 }}>Last Saved At: {new Date(lastSavedAt).toLocaleString()}</Typography>}

      <Tabs value={selectedCategory} onChange={handleCategoryChange} sx={{ mb: 2 }}>
        {budgetCategories.map((cat) => <Tab key={cat} label={cat} value={cat} />)}
      </Tabs>

      <Box sx={{ mb: 2, backgroundColor: '#c8e6c9', p: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
        <Typography variant="h6">Grand Total: {formatNumber(grandTotal)} {prevGrandTotal > 0 && <Typography variant="caption" sx={{ ml: 2 }}>Prev: {formatNumber(prevGrandTotal)}</Typography>}</Typography>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {loading ? <Box sx={{ textAlign: 'center', mt: 5 }}><CircularProgress /><Typography>Loading GL data...</Typography></Box> : (
          Object.entries(groupedItems).map(([sub2, subTitles]) => (
            // 在 AccordionDetails 中加入 Total 展示：
            <Accordion key={sub2} sx={{ backgroundColor: '#e8f5e9' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{sub2} (Total: {formatNumber(calculateSub2Total(subTitles))})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(subTitles).map(([subTitle, items]) => (
                  <Accordion key={subTitle} sx={{ mb: 2, backgroundColor: '#f1f8e9' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">{subTitle} (Total: {formatNumber(calculateGroupTotal(items))})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {items.map((item) => (
                        <Paper key={item.gl_code} sx={{ mb: 2, p: 2 }}>
                          <Grid container alignItems="center">
                            <Grid item xs={8}><Typography>{item.gl_code} - {item.gl_account_long_name}</Typography></Grid>
                            <Grid item xs={4} sx={{ textAlign: 'right' }}>
                              <Button variant="outlined" onClick={() => handleOpenDialog(item)} size="small">Total: {formatNumber(calculateItemTotal(item.gl_code))}</Button>
                              {calculateItemTotal(item.gl_code, previousValues) > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Prev: {formatNumber(calculateItemTotal(item.gl_code, previousValues))}</Typography>
                              )}
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>Monthly Details: {selectedItem?.gl_account_long_name}</DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Grid container spacing={2}>
            {months.map((month) => {
              const glCode = selectedItem?.gl_code;
              const relatedVal = relatedValues[glCode]?.[month];
              const prevVal = previousValues[glCode]?.[month];

              const showRelated = relatedVal !== null && relatedVal !== undefined && parseFloat(relatedVal) !== 0;
              const showPrev = prevVal !== null && prevVal !== undefined && parseFloat(prevVal) !== 0;

              return (
                <Grid item xs={3} key={month}>
                  <TextField
                    label={month}
                    type="number"
                    size="small"
                    fullWidth
                    value={inputValues[glCode]?.[month] || ''}
                    onChange={(e) => handleInputChange(glCode, month, e.target.value)}
                  />

                  {showRelated && (
                    <Box
                      mt={0.5}
                      px={1}
                      py={0.25}
                      borderRadius={1}
                      bgcolor="#e3f2fd"
                      fontSize={12}
                      color="text.secondary"
                    >
                      Related: {formatNumber(parseFloat(relatedVal))}
                    </Box>
                  )}

                  {showPrev && (
                    <Box
                      mt={0.5}
                      px={1}
                      py={0.25}
                      borderRadius={1}
                      bgcolor="#f5f5f5"
                      fontSize={12}
                      color="text.secondary"
                    >
                      Prev: {formatNumber(parseFloat(prevVal))}
                    </Box>
                  )}
                </Grid>
              );
            })}

          </Grid>

          {selectedCategory === 'Related' && (
            <Box
              mt={4}
              p={2}
              border={1}
              borderRadius={2}
              borderColor="divider"
              bgcolor="#fafafa"
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Autocomplete
                fullWidth
                options={[...new Set(groupedCompanies.map(gc => gc.company_name))]}
                value={selectedCompany}
                onChange={(e, value) => setSelectedCompany(value || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Company" variant="outlined" size="small" />
                )}
              />
              <TextField
                select
                label="Profit Center"
                size="small"
                fullWidth
                value={selectedProfitCenter}
                onChange={e => handleProfitCenterChange(e.target.value, selectedItem?.gl_code)}
                disabled={!selectedCompany}
                SelectProps={{ native: true }}
              >
                {availableProfitCenters.map(pc => (
                  <option key={pc} value={pc}>{pc}</option>
                ))}
              </TextField>

            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>


      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} message="✅ Budget saved successfully!" />
    </Box>
  );
};

export default BudgetInputPage;
