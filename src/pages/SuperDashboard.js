import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Fade,
    TablePagination,
    Stack
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import BlockIcon from '@mui/icons-material/Block';

const morandiColors = {
    background: '#f0ebe3',
    header: '#d3c6b8',
    lock: '#8d8d8d',
    unlock: '#6a7f7a',
    submitted: '#a97155',
    pending: '#aaa'
};

const SuperDashboardPage = () => {
    const [locks, setLocks] = useState([]);
    const [filteredLocks, setFilteredLocks] = useState([]);
    const [statusFilter, setStatusFilter] = useState('submitted');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const glyear = 2025;

    const fetchLocks = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/budget-lock/all-locks?glyear=${glyear}`);
            setLocks(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load locks', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocks();
    }, []);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            let data = locks;
            if (statusFilter === 'submitted') {
                data = locks.filter((l) => l.is_submitted);
            } else if (statusFilter === 'not_submitted') {
                data = locks.filter((l) => !l.is_submitted);
            }
            setFilteredLocks(data);
            setPage(0);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [locks, statusFilter]);

    const handleLock = async (cost_center_name, category) => {
        await axiosInstance.post('/budget-lock/lock-category', {
            cost_center_name,
            glyear,
            category
        });
        fetchLocks();
    };

    const handleUnlock = async (cost_center_name) => {
        await axiosInstance.post('/budget-lock/unlock', {
            cost_center_name,
            glyear
        });
        fetchLocks();
    };

    const handleReject = async (cost_center_name) => {
        await axiosInstance.post('/budget-lock/reject', {
            cost_center_name,
            glyear
        });
        fetchLocks();
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleString() : '-';
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
                Super User Budget Lock Manager ({glyear})
            </Typography>

            <FormControl sx={{ minWidth: 200, mb: 2 }} size="small">
                <InputLabel>Status Filter</InputLabel>
                <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => {
                        setLoading(true);
                        setStatusFilter(e.target.value);
                    }}
                >
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="not_submitted">Not Submitted</MenuItem>
                    <MenuItem value="all">All</MenuItem>
                </Select>
            </FormControl>

            {loading ? (
                <Fade in={loading}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                        <CircularProgress size={60} thickness={4} />
                    </Box>
                </Fade>
            ) : (
                <Paper sx={{ backgroundColor: morandiColors.background }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: morandiColors.header }}>
                                <TableRow>
                                    <TableCell>Cost Center</TableCell>
                                    <TableCell>Submit Status</TableCell>
                                    <TableCell>Unlock Request</TableCell>
                                    <TableCell>Locked Categories</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLocks
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row) => (
                                        <TableRow key={row.cost_center_name}>
                                            <TableCell>{row.cost_center_name}</TableCell>
                                            <TableCell>
                                                {row.is_submitted ? (
                                                    <Box>
                                                        <Chip label="Submitted" sx={{ backgroundColor: morandiColors.submitted, color: 'white' }} />
                                                        <Typography variant="caption" display="block">
                                                            {formatDate(row.submit_at)}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Chip label="Not Submitted" sx={{ backgroundColor: morandiColors.pending, color: 'white' }} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {row.unlock_requested ? (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ color: '#b45353' }}>{row.unlock_reason || '-'}</Typography>
                                                        <Typography variant="caption" display="block">{formatDate(row.unlock_at)}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Chip label="-" variant="outlined" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {row.category_locks && Object.keys(row.category_locks).length > 0 ? (
                                                    Object.keys(row.category_locks).map((cat) => (
                                                        <Chip
                                                            key={cat}
                                                            label={cat}
                                                            icon={<LockIcon fontSize="small" />}
                                                            size="small"
                                                            sx={{ m: 0.3, backgroundColor: morandiColors.lock, color: 'white' }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="body2">-</Typography>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    {(
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleLock(row.cost_center_name, 'Sales')}
                                                        >
                                                            Lock Sales
                                                        </Button>
                                                    )}
                                                    {Object.keys(row.category_locks || {}).length > 0 && (
                                                        <IconButton onClick={() => handleUnlock(row.cost_center_name)} color="success">
                                                            <LockOpenIcon />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to approve the unlock request for "${row.cost_center_name}"?`)) {
                                                                handleReject(row.cost_center_name);
                                                            }
                                                        }}
                                                        color="error"
                                                    >
                                                        <BlockIcon />
                                                    </IconButton>

                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        component="div"
                        count={filteredLocks.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}
        </Box>
    );
};

export default SuperDashboardPage;
