import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Accordion, AccordionSummary, AccordionDetails, Snackbar,
  IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axiosInstance from '../api/axiosInstance';
import CryptoJS from 'crypto-js';

const ppeCategories = [
  'AIR CONDITIONERS', 'BUILDING - FREEHOLD', 'BUILDING - LEASEHOLD', 'CAPITAL EXPENDITURE IN PROGRESS',
  'COMPUTER HARDWARE', 'COMPUTER SOFTWARE', 'ELECTRICAL INSTALLATION', 'FUNERAL SERVICE EQUIPMENT',
  'FURNITURE & FITTING', 'HEARSE', 'LAND - FREEHOLD', 'LAND & BUILDING - FREEHOLD',
  'LAND & BUILDING - LEASEHOLD', 'LIMOUSINE', 'MOTOR VEHICLE', 'OFFICE EQUIPMENT',
  'PLANT & MACHINERY', 'RENOVATION', 'SMALL VALUE ASSETS'
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PPEInputPage = () => {
  const [items, setItems] = useState({});
  const [initialValues, setInitialValues] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    handleLoad();

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const hasUnsavedChanges = () => {
    return JSON.stringify(items) !== JSON.stringify(initialValues);
  };

  const handleLoad = async () => {
    try {
      const response = await axiosInstance.get('/ppe/load', { params: { year: 2025 } });
      if (response.data && response.data.current) {
        setItems(response.data.current);
        setInitialValues(response.data.current);  // 保存初始状态用于比对
        setLastSavedAt(response.data.savedAt || null);
      }
    } catch (err) {
      console.error('Failed to load PPE data:', err);
    }
  };

  const calculateItemTotal = (item) => {
    const cost = parseFloat(item.unitCost || 0);
    return months.reduce((sum, month) => {
      const unit = parseFloat(item.monthlyUnit?.[month] || 0);
      return sum + (unit * cost);
    }, 0);
  };

  const calculateCategorySubtotal = (category) => (items[category] || []).reduce((subtotal, item) => subtotal + calculateItemTotal(item), 0);

  const formatNumber = (number) => number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const openModal = (category, item = null) => {
    setCurrentCategory(category);
    setCurrentItem(
      item || {
        id: Date.now(),
        description: '',
        purpose: '',
        unitCost: '',
        monthlyUnit: {}
      }
    );
    setModalOpen(true);
  };

  const saveModalItem = () => {
    if (!currentItem.description || !currentItem.purpose || currentItem.unitCost === '') return;

    setItems(prev => {
      const updated = {
        ...prev,
        [currentCategory]: prev[currentCategory]?.some(i => i.id === currentItem.id)
          ? prev[currentCategory].map(i => i.id === currentItem.id ? currentItem : i)
          : [...(prev[currentCategory] || []), currentItem]
      };
      return updated;
    });

    setModalOpen(false);
  };

  const removeItem = (category, itemId) => {
    setItems(prev => {
      const updated = {
        ...prev,
        [category]: prev[category].filter(item => item.id !== itemId)
      };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      const secretKey = process.env.REACT_APP_SECRET_KEY?.trim();
      if (!secretKey) {
        alert('Missing secret key in environment');
        return;
      }

      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify({ year: 2025, data: items }),
        secretKey
      ).toString();

      await axiosInstance.post('/ppe/save', { data: encrypted });

      setInitialValues(items);  // 保存后更新基准
      setLastSavedAt(new Date().toISOString());
      setSnackbarOpen(true);
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: '#fdfdfb', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Typography variant="h4" sx={{ mb: 1, color: '#4b4a47', fontWeight: 'bold' }}>PPE Input for 2025</Typography>
      {lastSavedAt && <Typography variant="body2" sx={{ mb: 2, color: '#7a7a7a' }}>Last saved at: {new Date(lastSavedAt).toLocaleString()}</Typography>}
      <Button variant="contained" sx={{ mb: 3, bgcolor: '#f0e3d3', color: '#4b4a47' }} onClick={handleSave}>Save All</Button>

      {ppeCategories.map(category => (
        <Accordion key={category} sx={{ mb: 2, borderRadius: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f0e3d3' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: '#4b4a47' }}>
              {category} — Subtotal: {formatNumber(calculateCategorySubtotal(category))}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#fdfaf6' }}>
            <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2, color: '#4b4a47', borderColor: '#4b4a47' }} onClick={() => openModal(category)}>Add Item</Button>

            {(items[category] || []).map(item => (
              <Paper key={item.id} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', bgcolor: '#fdfdfb' }}>
                <Box>
                  <Typography variant="body1" fontWeight="medium" color="#4b4a47">{item.description}</Typography>
                  <Typography variant="body2" color="#4b4a47">{item.purpose}</Typography>
                  <Typography variant="body2" sx={{ color: '#4b4a47' }}>Unit Cost: {formatNumber(item.unitCost)}</Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#4b4a47' }}>Total: {formatNumber(calculateItemTotal(item))}</Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => openModal(category, item)}><EditIcon sx={{ color: '#4b4a47' }} /></IconButton>
                  <IconButton onClick={() => removeItem(category, item.id)}><DeleteIcon sx={{ color: '#4b4a47' }} /></IconButton>
                </Box>
              </Paper>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      <Dialog open={modalOpen} fullWidth maxWidth="md">
        <DialogTitle sx={{ color: '#4b4a47' }}>{currentItem?.id ? 'Edit Item' : 'Add Item'} ({currentCategory})</DialogTitle>
        <DialogContent sx={{ bgcolor: '#fdfdfb' }}>
          <TextField label="Description" fullWidth margin="dense" value={currentItem?.description || ''} onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })} />
          <TextField label="Purpose" fullWidth margin="dense" value={currentItem?.purpose || ''} onChange={e => setCurrentItem({ ...currentItem, purpose: e.target.value })} />
          <TextField label="Unit Cost" fullWidth margin="dense" type="number" value={currentItem?.unitCost || ''} onChange={e => setCurrentItem({ ...currentItem, unitCost: e.target.value })} />

          <Grid container spacing={1}>
            {months.map(month => (
              <Grid item xs={3} key={month}>
                <Typography variant="subtitle2" color="#4b4a47">{month}</Typography>
                <TextField
                  label="Unit"
                  type="number"
                  size="small"
                  fullWidth
                  margin="dense"
                  value={currentItem?.monthlyUnit?.[month] || ''}
                  onChange={e => setCurrentItem({
                    ...currentItem,
                    monthlyUnit: {
                      ...currentItem.monthlyUnit,
                      [month]: e.target.value
                    }
                  })}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#fdfdfb' }}>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#f0e3d3', color: '#4b4a47' }} onClick={saveModalItem}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} message="✅ PPE data saved successfully!" />
    </Box>
  );
};

export default PPEInputPage;
