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
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';


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
    const [statusFilter, setStatusFilter] = useState('requested');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const glyear = 2025;
    const [selectedCategories, setSelectedCategories] = useState({});
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [selectedProfitCenters, setSelectedProfitCenters] = useState([]);
    const [selectedCostCenters, setSelectedCostCenters] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error' | 'info'
    const [actionLoading, setActionLoading] = useState(false);

    const budgetCategories = ['Sales', 'Trustee', 'Cost', 'NonOperating', 'Direct', 'Indirect', 'Manpower', 'Int, Tax, Depr.', 'Related'];


    const [selectedLockCategories, setSelectedLockCategories] = useState(budgetCategories); // 默认全选

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };


    const unique = (arr) => [...new Set(arr)];

    const allUsers = locks.map(l => l.userInfo).filter(Boolean);

    const regionOptions = unique(allUsers.map(u => u.region));
    const companyOptions = unique(
        allUsers
            .filter(u => selectedRegions.length === 0 || selectedRegions.includes(u.region))
            .map(u => u.companyid)
    );

    const profitCenterOptions = unique(
        allUsers
            .filter(u =>
                (selectedRegions.length === 0 || selectedRegions.includes(u.region)) &&
                (selectedCompanyIds.length === 0 || selectedCompanyIds.includes(u.companyid))
            )
            .map(u => u.profit_center)
    );
    const costCenterOptions = unique(allUsers.map(u => u.cost_center));



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
                data = data.filter((l) => l.is_submitted);
            } else if (statusFilter === 'not_submitted') {
                data = data.filter((l) => !l.is_submitted);
            } else if (statusFilter === 'requested') {
                data = data.filter((l) => l.unlock_requested === true);
            }


            if (selectedRegions.length > 0) {
                data = data.filter(l => selectedRegions.includes(l.userInfo?.region));
            }
            if (selectedCompanyIds.length > 0) {
                data = data.filter(l => selectedCompanyIds.includes(l.userInfo?.companyid));
            }
            if (selectedProfitCenters.length > 0) {
                data = data.filter(l => selectedProfitCenters.includes(l.userInfo?.profit_center));
            }
            if (selectedCostCenters.length > 0) {
                data = data.filter(l => selectedCostCenters.includes(l.userInfo?.cost_center));
            }

            setFilteredLocks(data);
            setPage(0);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [locks, statusFilter, selectedRegions, selectedProfitCenters, selectedCostCenters]);


    const handleLock = async (cost_center_name, category) => {
        setActionLoading(true);
        try {
            await axiosInstance.post('/budget-lock/lock-category', {
                cost_center_name,
                glyear,
                category
            });
            showSnackbar(`✅ '${category}' locked for ${cost_center_name}`);
            fetchLocks();
        } catch (err) {
            console.error('Lock error:', err);
            showSnackbar('❌ Lock failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async (cost_center_name) => {
        setActionLoading(true);
        try {
            await axiosInstance.post('/budget-lock/unlock', {
                cost_center_name,
                glyear
            });
            showSnackbar(`🔓 Categories unlocked for ${cost_center_name}`);
            fetchLocks();
        } catch (err) {
            console.error('Unlock error:', err);
            showSnackbar('❌ Unlock failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (cost_center_name) => {
        const confirmed = window.confirm(`Are you sure you want to reject & unlock "${cost_center_name}"?`);
        if (!confirmed) return;

        setActionLoading(true);
        try {
            await axiosInstance.post('/budget-lock/reject', {
                cost_center_name,
                glyear
            });
            showSnackbar(`🚫 Rejected & unlocked ${cost_center_name}`);
            fetchLocks();
        } catch (err) {
            console.error('Reject error:', err);
            showSnackbar('❌ Reject failed', 'error');
        } finally {
            setActionLoading(false);
        }
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

    const CategorySelector = ({ rowKey, onLock }) => {
        return (
            <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                        displayEmpty
                        value={selectedCategories[rowKey] || ''}
                        onChange={(e) =>
                            setSelectedCategories(prev => ({ ...prev, [rowKey]: e.target.value }))
                        }
                    >
                        <MenuItem value="">Select Category</MenuItem>
                        {budgetCategories.map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        if (!selectedCategories[rowKey]) return;
                        onLock(rowKey, selectedCategories[rowKey]);
                        setSelectedCategories(prev => ({ ...prev, [rowKey]: '' }));
                    }}
                >
                    Lock
                </Button>
            </Stack>
        );
    };


    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
                Super User ({glyear})
            </Typography>

            <FormControl sx={{ minWidth: 200, mb: 2 }} size="small">
                <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
                    <MultiSelectDropdown
                        label="Region"
                        options={regionOptions}
                        selected={selectedRegions}
                        onChange={setSelectedRegions}
                    />

                    <MultiSelectDropdown
                        label="Company"
                        options={companyOptions}
                        selected={selectedCompanyIds}
                        onChange={setSelectedCompanyIds}
                    />


                    <MultiSelectDropdown
                        label="Profit Center"
                        options={profitCenterOptions}
                        selected={selectedProfitCenters}
                        onChange={setSelectedProfitCenters}
                    />

                    <MultiSelectDropdown
                        label="Cost Center"
                        options={costCenterOptions}
                        selected={selectedCostCenters}
                        onChange={setSelectedCostCenters}
                    />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status Filter</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status Filter"
                            onChange={(e) => {
                                setLoading(true);
                                setStatusFilter(e.target.value);
                            }}
                        >
                            <MenuItem value="requested">Unlock Requested</MenuItem>
                            <MenuItem value="submitted">Submitted</MenuItem>
                            <MenuItem value="not_submitted">Not Submitted</MenuItem>
                            <MenuItem value="all">All</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
                <Stack direction="row" spacing={2} mb={2} alignItems="center" flexWrap="wrap">
                    <MultiSelectDropdown
                        label="Categories to Lock"
                        options={budgetCategories}
                        selected={selectedLockCategories}
                        onChange={setSelectedLockCategories}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        disabled={selectedLockCategories.length === 0 || actionLoading}
                        onClick={async () => {
                            const confirmed = window.confirm(
                                `Lock selected categories for filtered cost centers?\n[${selectedLockCategories.join(', ')}]`
                            );
                            if (!confirmed) return;

                            setActionLoading(true);
                            setLoading(true)
                            try {
                                await axiosInstance.post('/budget-lock/bulk-lock-categories', {
                                    glyear,
                                    categories: selectedLockCategories,
                                    filter: {
                                        region: selectedRegions,
                                        companyid: selectedCompanyIds,
                                        profit_center: selectedProfitCenters,
                                        cost_center: selectedCostCenters
                                    },
                                    status: statusFilter
                                });
                                showSnackbar('✅ Categories locked');
                                fetchLocks();
                            } catch (err) {
                                console.error('Lock error:', err);
                                showSnackbar('❌ Lock failed', 'error');
                            } finally {
                                setActionLoading(false);
                                setLoading(false)
                            }
                        }}
                    >
                        🔒 Lock Selected Categories
                    </Button>

                    <Button
                        variant="outlined"
                        color="warning"
                        disabled={actionLoading}
                        onClick={async () => {
                            const confirmed = window.confirm("Unlock all categories for filtered cost centers?");
                            if (!confirmed) return;

                            setActionLoading(true);
                            setLoading(true)
                            try {
                                await axiosInstance.post('/budget-lock/bulk-unlock-categories', {
                                    glyear,
                                    filter: {
                                        region: selectedRegions,
                                        companyid: selectedCompanyIds,
                                        profit_center: selectedProfitCenters,
                                        cost_center: selectedCostCenters
                                    },
                                    status: statusFilter
                                });
                                showSnackbar('✅ All categories unlocked');
                                fetchLocks();
                            } catch (err) {
                                console.error('Unlock error:', err);
                                showSnackbar('❌ Unlock failed', 'error');
                            } finally {
                                setActionLoading(false);
                                setLoading(false)
                            }
                        }}
                    >
                        🔓 Unlock All Categories
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        disabled={actionLoading}
                        onClick={async () => {
                            const confirmed = window.confirm("Reject all submitted budgets for filtered cost centers?\nThis will unlock them for editing.");
                            if (!confirmed) return;

                            setActionLoading(true);
                            setLoading(true)
                            try {
                                await axiosInstance.post('/budget-lock/bulk-approve-unlock', {
                                    glyear,
                                    filter: {
                                        region: selectedRegions,
                                        companyid: selectedCompanyIds,
                                        profit_center: selectedProfitCenters,
                                        cost_center: selectedCostCenters
                                    },
                                    status: statusFilter
                                });
                                showSnackbar('✅ All filtered submitted budgets rejected');
                                fetchLocks();
                            } catch (err) {
                                console.error('Reject error:', err);
                                showSnackbar('❌ Rejection failed', 'error');
                            } finally {
                                setActionLoading(false);
                                setLoading(false)
                            }
                        }}
                    >
                        🚫 Reject All Submitted
                    </Button>


                </Stack>


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
                                                    <CategorySelector rowKey={row.cost_center_name} onLock={handleLock} />
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
            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </Box>

    );

};

export default SuperDashboardPage;
