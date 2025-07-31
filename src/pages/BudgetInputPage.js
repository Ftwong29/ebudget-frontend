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
const budgetCategories = ['Sales', 'Trustee', 'Cost', 'NonOperating', 'Direct', 'Indirect', 'Manpower', 'Int, Tax, Depr.', 'Related'];

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
  const [relatedGLInfo, setRelatedGLInfo] = useState([]);
  const [selectedGlCode, setSelectedGlCode] = useState('');

  const [lockStatus, setLockStatus] = useState(null);

  const loadLockStatus = async () => {
    try {
      const res = await axiosInstance.get('/budget-lock/status', {
        params: { glyear: 2025 }
      });
      setLockStatus(res.data);
    } catch (err) {
      console.error('❌ Failed to load lock status:', err);
    }
  };




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

      const { glItems, groupedData, relatedGLInfo } = res.data;
      setGlItems(glItems);
      setGroupedCompanies(groupedData);
      setRelatedGLInfo(relatedGLInfo || []); // ✅ 新加
      setSelectedCompany('');
      setAvailableProfitCenters([]);
      setSelectedProfitCenter('');

      await loadSavedValues(category);
    } catch (err) {
      console.error('❌ Failed to load GL items:', err);
    } finally {
      setLoading(false);
      setRecalculateFlag(prev => !prev);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGLData(selectedCategory);
      loadLockStatus();
    }
  }, [selectedCategory, user]);


  useEffect(() => {

    if (!Array.isArray(groupedCompanies)) return;

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

  useEffect(() => {
    const refreshOnSubmit = () => {
      loadLockStatus(); // ✅ 重新拉锁状态
    };

    window.addEventListener('budget-submitted', refreshOnSubmit);

    return () => {
      window.removeEventListener('budget-submitted', refreshOnSubmit);
    };
  }, []);


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
    setSelectedGlCode('');
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
        category: selectedCategory.toLowerCase(), // ✅ 新增
        values: inputValues
      }), secretKey).toString();
  
      await axiosInstance.post(`/gl/glinput-save`, { data: encryptedPayload });
  
      setInitialValues(inputValues);
      setLastSavedAt(new Date());
      setSnackbarOpen(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
    
      if (err?.response?.status === 403 && msg.includes('locked')) {
        alert(`⚠️ This category has been locked by an admin.\n\nPlease refresh the page to update the lock status before editing.`);
      } else {
        alert('Failed to save: ' + msg);
      }
    }
    
  };
  


  const handleProfitCenterChange = async (value: string, glCode?: string) => {
    setSelectedProfitCenter(value);
    setLoading(true);
    try {
      const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify({
        glyear: 2025,
        company: selectedCompany,
        profitCenter: value,
        glcode: glCode?.toString()
      }), secretKey).toString();

      const res = await axiosInstance.post('/gl/glinput-load-related', {
        data: encryptedPayload
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
  const isSubmitted = lockStatus?.is_submitted;
  const isCategoryLocked = lockStatus?.category_locks?.[selectedCategory.toLowerCase()];
  const isEditable = !isSubmitted && !isCategoryLocked;

  return (
    <Box sx={{ padding: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4">Budget Input: {selectedCategory} (2025)</Typography>
      <Typography variant="body2">Branch: {user.branchcode2}</Typography>
      {lastSavedAt && <Typography variant="body2" sx={{ mb: 1 }}>Last Saved At: {new Date(lastSavedAt).toLocaleString()}</Typography>}

      <Tabs value={selectedCategory} onChange={handleCategoryChange} sx={{ mb: 2 }}>
        {budgetCategories.map((cat) => {
          const lowerCat = cat.toLowerCase();
          const isLocked = lockStatus?.category_locks?.[lowerCat];
          const isSubmitted = lockStatus?.is_submitted;

          // ✅ 如果已提交 -> 打勾；否则判断是否该类别被锁
          const icon = isLocked
            ? '🔒'
            : isSubmitted
              ? '✅'
              : '';


          return (
            <Tab
              key={cat}
              value={cat}
              label={`${icon} ${cat}`}
            />
          );
        })}
      </Tabs>


      <Box sx={{ mb: 2, backgroundColor: '#c8e6c9', p: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
        <Typography variant="h6">Grand Total: {formatNumber(grandTotal)} {prevGrandTotal > 0 && <Typography variant="caption" sx={{ ml: 2 }}>Prev: {formatNumber(prevGrandTotal)}</Typography>}</Typography>
        {(!isSubmitted && !isCategoryLocked) && (
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {loading ? <Box sx={{ textAlign: 'center', mt: 5 }}><CircularProgress /><Typography>Loading GL data...</Typography></Box> : (
          Object.entries(groupedItems).map(([sub2, subTitles]) => (
            // 在 AccordionDetails 中加入 Total 展示：
            <Accordion key={sub2} sx={{ backgroundColor: '#e8f5e9' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {sub2} (Total: {formatNumber(calculateSub2Total(subTitles))})
                  {calculateSub2Total(subTitles, previousValues) > 0 && (
                    <Typography component="span" variant="caption" sx={{ ml: 2 }}>
                      Prev: {formatNumber(calculateSub2Total(subTitles, previousValues))}
                    </Typography>
                  )}
                </Typography>

              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(subTitles).map(([subTitle, items]) => (
                  <Accordion key={subTitle} sx={{ mb: 2, backgroundColor: '#f1f8e9' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        {subTitle} (Total: {formatNumber(calculateGroupTotal(items))})
                        {calculateGroupTotal(items, previousValues) > 0 && (
                          <Typography component="span" variant="caption" sx={{ ml: 2 }}>
                            Prev: {formatNumber(calculateGroupTotal(items, previousValues))}
                          </Typography>
                        )}
                      </Typography>

                    </AccordionSummary>
                    <AccordionDetails>
                      {items.map((item) => (
                        <Paper key={item.gl_code} sx={{ mb: 2, p: 2 }}>
                          <Grid container alignItems="center">
                            <Grid item xs={8}><Typography>{item.gl_code} - {item.gl_account_long_name}</Typography></Grid>
                            <Grid item xs={4} sx={{ textAlign: 'right' }}>
                              {isSubmitted || isCategoryLocked ? (
                                <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {isCategoryLocked ? '🔒' : isSubmitted ? '✅' : ''} Total: {formatNumber(calculateItemTotal(item.gl_code))}
                                  </Typography>

                                  {(calculateItemTotal(item.gl_code, previousValues) > 0) && (
                                    <Typography variant="caption" sx={{ mt: 0.5 }} color="text.disabled">
                                      Prev: {formatNumber(calculateItemTotal(item.gl_code, previousValues))}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Button
                                  variant="outlined"
                                  onClick={() => handleOpenDialog(item)}
                                  size="small"
                                >
                                  Total: {formatNumber(calculateItemTotal(item.gl_code))}
                                </Button>
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

        <DialogContent sx={{ py: 0 }}>
          {/* ✅ 加入 padding 容器确保底部按钮与总和有足够空隙，避免遮挡 */}
          <Box sx={{ maxHeight: '65vh', overflowY: 'auto', px: 3, pt: 3 }}>
            <Grid container spacing={2}>
              {months.map((month) => {
                const glCode = selectedItem?.gl_code;
                const relatedVal = relatedValues[selectedGlCode]?.[month];
                const prevVal = previousValues[glCode]?.[month];

                const showRelated = relatedVal !== null && relatedVal !== undefined && parseFloat(relatedVal) !== 0;
                const showPrev = prevVal !== null && prevVal !== undefined && parseFloat(prevVal) !== 0;

                return (
                  <Grid item xs={12} sm={6} md={3} key={month} sx={{ scrollMarginTop: '100px' }}>
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

            {/* ✅ 实时总和展示 */}
            {selectedItem && (
              <Box mt={4} textAlign="right">
                <Typography variant="h6">
                  Total: {formatNumber(calculateItemTotal(selectedItem.gl_code))}
                </Typography>
                {/* Related Total */}
                {relatedValues[selectedGlCode] && (
                  <Typography variant="body2" color="text.secondary">
                    Related Total:{" "}
                    {formatNumber(
                      months.reduce((sum, m) => {
                        const val = parseFloat(relatedValues[selectedGlCode]?.[m]) || 0;
                        return sum + val;
                      }, 0)
                    )}
                  </Typography>
                )}

                {/* Previous Total */}
                {previousValues[selectedItem.gl_code] && (
                  <Typography variant="body2" color="text.secondary">
                    Prev Total:{" "}
                    {formatNumber(
                      months.reduce((sum, m) => {
                        const val = parseFloat(previousValues[selectedItem.gl_code]?.[m]) || 0;
                        return sum + val;
                      }, 0)
                    )}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* 相关公司选择器（保持原状） */}
          {(
            selectedCategory === 'Related' ||
            (
              selectedItem?.lvl1 === 2 &&
              (
                selectedItem?.sub2 === 'PRE-NEED COST OF SALES' ||
                selectedItem?.sub2 === 'AS-NEED COST OF SALES'
              )
            )
          ) && (
              <Box
                mt={4}
                px={3}
                pb={2}
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={2}
                flexWrap="wrap"
              >
                {/* 公司选择器 */}
                <Autocomplete
                  fullWidth
                  options={[...new Set((groupedCompanies || []).map(gc => gc.company_name))]}
                  value={selectedCompany}
                  onChange={(e, value) => setSelectedCompany(value || '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Company" variant="outlined" size="small" />
                  )}
                />


                {/* Profit Center */}
                <TextField
                  select
                  label="Profit Center"
                  size="small"
                  fullWidth
                  value={selectedProfitCenter}
                  onChange={e => handleProfitCenterChange(e.target.value, selectedGlCode)}
                  disabled={!selectedCompany}
                  SelectProps={{ native: true }}
                >
                  {availableProfitCenters.map(pc => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </TextField>

                {/* ✅ Related GL Info */}
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={selectedGlCode}
                  onChange={(e) => {
                    const glCode = e.target.value;
                    setSelectedGlCode(glCode);              // ✅ 触发重新渲染 input 区
                    handleProfitCenterChange(selectedProfitCenter, glCode);
                  }}

                  SelectProps={{ native: true }}
                >
                  <option value="">Select GL Code</option>
                  {relatedGLInfo.map(info => (
                    <option key={info.gl_code} value={info.gl_code}>
                      {info.gl_code} - {info.gl_account_short_name}
                    </option>
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
