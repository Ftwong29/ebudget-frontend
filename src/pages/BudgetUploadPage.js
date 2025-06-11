import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Snackbar, Alert, Table, TableHead, TableBody, TableCell, TableRow } from '@mui/material';
import * as XLSX from 'xlsx';
import axiosInstance from '../api/axiosInstance';

const BudgetUploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    setMessage('');

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    setPreviewData(json);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setMessage('');
    setUploadErrors([]);

    try {
      const res = await axiosInstance.post('/upload/upload-budgets', { data: previewData });

      setMessage(res.data.message || '✅ Upload successful');
    } catch (err) {
      console.error(err);
      const responseErrors = err.response?.data?.errors;
      setUploadErrors(responseErrors || []);
      setError(err.response?.data?.message || '❌ Upload failed');
    } finally {
      setUploading(false);
      setOpen(true);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Upload Budget Excel</Typography>
      <Paper sx={{ p: 3, mb: 2 }}>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        {uploading && <CircularProgress sx={{ mt: 2 }} />}
      </Paper>

      {previewData.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, maxHeight: 400, overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Preview Data</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {Object.keys(previewData[0]).map((key) => (
                  <TableCell key={key}>{key}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, idx) => (
                <TableRow key={idx}>
                  {Object.values(row).map((value, idx2) => (
                    <TableCell key={idx2}>{value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {previewData.length > 0 && (
        <Button variant="contained" color="primary" onClick={handleUpload} disabled={uploading}>
          Confirm Upload
        </Button>
      )}

      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={error ? 'error' : 'success'}>
          {error || message}
        </Alert>
      </Snackbar>

      {uploadErrors.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: '#fce4e4' }}>
          <Typography variant="subtitle1" sx={{ color: '#d32f2f' }}>Errors Found:</Typography>
          <ul>
            {uploadErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Paper>
      )}
    </Box>
  );
};

export default BudgetUploadPage;
