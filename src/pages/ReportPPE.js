import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
    Box, Typography, Paper, CircularProgress, Table,
    TableBody, TableCell, TableHead, TableRow, TableContainer,
    Stack, FormControlLabel, Switch, Tooltip, Button, Fade, FormControl, InputLabel, Select, MenuItem,
    Menu, Checkbox, ListItemText, IconButton

} from '@mui/material';
import { useSelector } from 'react-redux';
import { UnfoldLess, UnfoldMore, ExpandMore, ChevronRight } from '@mui/icons-material';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ppeCategories = [
    'AIR CONDITIONERS', 'BUILDING - FREEHOLD', 'BUILDING - LEASEHOLD', 'CAPITAL EXPENDITURE IN PROGRESS',
    'COMPUTER HARDWARE', 'COMPUTER SOFTWARE', 'ELECTRICAL INSTALLATION', 'FUNERAL SERVICE EQUIPMENT',
    'FURNITURE & FITTING', 'HEARSE', 'LAND - FREEHOLD', 'LAND & BUILDING - FREEHOLD',
    'LAND & BUILDING - LEASEHOLD', 'LIMOUSINE', 'MOTOR VEHICLE', 'OFFICE EQUIPMENT',
    'PLANT & MACHINERY', 'RENOVATION', 'SMALL VALUE ASSETS'
];
const ReportPPE = () => {
    const { user } = useSelector((state) => state.auth);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currencyInfo, setCurrencyInfo] = useState(null);
    const [availableProfitCenters, setAvailableProfitCenters] = useState([]);
    const [availableCostCenters, setAvailableCostCenters] = useState([]);
    const [selectedProfitCenters, setSelectedProfitCenters] = useState([]);
    const [selectedCostCenters, setSelectedCostCenters] = useState([]);
    const [currencyMode, setCurrencyMode] = useState('base');
    const [valueScale, setValueScale] = useState('normal');
    const [switching, setSwitching] = useState(false);
    const [groupExpanded, setGroupExpanded] = useState({});

    useEffect(() => {
        const initStructure = async () => {
            if (user?.cost_center !== 'FIN&CORP') return;

            try {
                const structureRes = await axiosInstance.get('/report/company-structure');
                const pcs = structureRes.data.profit_centers || [];
                const ccs = structureRes.data.cost_centers || [];

                setAvailableProfitCenters(pcs);
                setAvailableCostCenters(ccs);

                setSelectedProfitCenters(pcs);
                setSelectedCostCenters(ccs);
            } catch (err) {
                console.error('❌ Failed to load structure:', err);
            }
        };

        initStructure();
    }, [user]);

    useEffect(() => {
        const fetchPPE = async () => {
            try {
                const isFINCORP = user?.cost_center === 'FIN&CORP';
                const params = {
                    year: 2025,
                    _: Date.now()
                };

                if (isFINCORP) {
                    params.profit_centers = selectedProfitCenters;
                    params.cost_centers = selectedCostCenters;
                }

                setSwitching(true);
                const res = await axiosInstance.get('/report/ppe', { params });
                setRecords(res.data.data || []);
                setCurrencyInfo(res.data.currency_info || null);
            } catch (err) {
                console.error('❌ Failed to load PPE report:', err);
            } finally {
                setLoading(false);
                setTimeout(() => setSwitching(false), 400);
            }
        };
        if (user) fetchPPE();
    }, [user, selectedProfitCenters, selectedCostCenters]);

    const convertAndScale = (value) => {
        const rate = currencyInfo?.rate || 1;
        const converted = currencyMode === 'user' ? value * rate : value;
        switch (valueScale) {
            case 'million': return converted / 1_000_000;
            case 'thousand': return converted / 1_000;
            default: return converted;
        }
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

    const toggleGroup = (category) => {
        setGroupExpanded(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const expandAllGroups = () => {
        const all = {};
        ppeCategories.forEach(cat => all[cat] = true);
        setGroupExpanded(all);
    };

    const collapseAllGroups = () => {
        const all = {};
        ppeCategories.forEach(cat => all[cat] = false);
        setGroupExpanded(all);
    };

    const showCurrencySwitch = currencyInfo && currencyInfo.base_currency !== currencyInfo.user_currency;

    const groupedRecords = ppeCategories.map(cat => ({
        category: cat,
        items: records.filter(r => r.category === cat)
    })).filter(g => g.items.length > 0);

    const allExpanded = groupedRecords.every(g => groupExpanded[g.category]);

    const grandTotalYTD = groupedRecords.reduce((total, group) => {
        return total + group.items.reduce((sum, item) => sum + months.reduce((s, m) => s + parseFloat(item.values?.[m] || 0), 0), 0);
    }, 0);

    const grandTotalUnitsYTD = groupedRecords.reduce((total, group) => {
        return total + group.items.reduce((sum, item) => sum + months.reduce((s, m) => s + parseFloat(item.units?.[m] || 0), 0), 0);
    }, 0);

    const grandTotalMonthlySummary = months.map(m => {
        const totalLC = groupedRecords.reduce((total, group) => {
            return total + group.items.reduce((sum, item) => sum + parseFloat(item.values?.[m] || 0), 0);
        }, 0);

        const totalUnit = groupedRecords.reduce((total, group) => {
            return total + group.items.reduce((sum, item) => sum + parseFloat(item.units?.[m] || 0), 0);
        }, 0);

        return { lc: totalLC, unit: totalUnit };
    });

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>PPE Report (2025)</Typography>

            <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
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

                    {user?.cost_center === 'FIN&CORP' && (
                        <Tooltip title={allExpanded ? 'Collapse all' : 'Expand all'}>
                            <Button
                                variant="outlined"
                                size="small"
                                color={allExpanded ? 'secondary' : 'primary'}
                                sx={{ minWidth: 128, fontWeight: 600, borderRadius: 2 }}
                                startIcon={allExpanded ? <UnfoldLess /> : <UnfoldMore />}
                                onClick={() => allExpanded ? collapseAllGroups() : expandAllGroups()}
                                disableElevation
                            >
                                {allExpanded ? 'Collapse All' : 'Expand All'}
                            </Button>
                        </Tooltip>
                    )}
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

                    <Fade in={switching} unmountOnExit>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            <Typography variant="body2" color="primary.main" fontWeight={500}>Updating view...</Typography>
                        </Box>
                    </Fade>
                </Stack>
            </Box>


            {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                // updated section only
                <TableContainer component={Paper}>
                    <Table size="small" stickyHeader>
                        {/* Grand Total Row */}
                        <TableRow sx={{ backgroundColor: '#FFF8DB', fontWeight: 'bold' }}>
                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                Total
                            </TableCell>

                            <TableCell colSpan={2} align="right">
                                <div style={{ fontWeight: 'bold', color: '#222', fontSize: '1rem' }}>
                                    {convertAndScale(grandTotalYTD).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.8em', color: '#555' }}>
                                    {grandTotalUnitsYTD} unit
                                </div>
                            </TableCell>

                            {grandTotalMonthlySummary.map((val, idx) => (
                                <TableCell key={`grand-${idx}`} align="right">
                                    <div style={{ fontWeight: 'bold', color: '#222', fontSize: '1rem' }}>
                                        {convertAndScale(val.lc).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: '0.8em', color: '#555' }}>
                                        {val.unit} unit
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>

                        <TableHead>
                            <TableRow>
                                <TableCell>Category</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>

                                <TableCell align="right">YTD</TableCell>
                                {months.map(month => (
                                    <TableCell key={`head-${month}`} align="right">{month}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groupedRecords.map(group => {
                                const groupYTD = group.items.reduce((sum, i) => sum + months.reduce((s, m) => s + parseFloat(i.values?.[m] || 0), 0), 0);
                                const groupYTDUnit = group.items.reduce((sum, i) => sum + months.reduce((s, m) => s + parseFloat(i.units?.[m] || 0), 0), 0);
                                const groupMonthlySummary = months.map(m => {
                                    const unit = group.items.reduce((sum, i) => sum + parseFloat(i.units?.[m] || 0), 0);
                                    const lc = group.items.reduce((sum, i) => sum + parseFloat(i.values?.[m] || 0), 0);
                                    return { unit, lc };
                                });
                                return (
                                    <React.Fragment key={group.category}>
                                        <TableRow sx={{ backgroundColor: '#EAE6FA', fontWeight: 600 }}>
                                            <TableCell colSpan={1} sx={{ fontWeight: 'bold' }}>
                                                <IconButton size="small" onClick={() => toggleGroup(group.category)}>
                                                    {groupExpanded[group.category] ? <ExpandMore /> : <ChevronRight />}
                                                </IconButton>
                                                {group.category}
                                            </TableCell>
                                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>

                                            <TableCell colSpan={2} align="right">
                                                <div style={{ fontWeight: 'bold', color: '#444' }}>{convertAndScale(groupYTD).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                <div style={{ fontSize: '0.75em', color: '#888' }}>{groupYTDUnit} unit</div>
                                            </TableCell>
                                            {groupMonthlySummary.map((val, idx) => (
                                                <TableCell key={`sub-${idx}`} align="right">
                                                    <div style={{ fontWeight: 'bold', color: '#444' }}>{convertAndScale(val.lc).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    <div style={{ fontSize: '0.75em', color: '#888' }}>{val.unit} unit</div>
                                                </TableCell>
                                            ))}
                                        </TableRow>


                                        {groupExpanded[group.category] && (
                                            <>
                                                <TableRow sx={{ backgroundColor: '#cfe2f3' }}>
                                                    <TableCell>Cost Center</TableCell>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell>Purpose</TableCell>
                                                    <TableCell>Cost/Unit</TableCell>
                                                    <TableCell align="right">YTD</TableCell>
                                                    {months.map(month => (
                                                        <TableCell key={`head-${month}`} align="right">{month}</TableCell>
                                                    ))}
                                                </TableRow>

                                                {group.items.map((item, idx) => {
                                                    const ytd = months.reduce((sum, m) => sum + (parseFloat(item.values?.[m] || 0)), 0);
                                                    const ytdUnit = months.reduce((sum, m) => sum + (parseFloat(item.units?.[m] || 0)), 0);
                                                    return (
                                                        <TableRow key={idx}>
                                                            <TableCell>{item.userid}</TableCell>
                                                            <TableCell>{item.description}</TableCell>
                                                            <TableCell>{item.purpose}</TableCell>
                                                            <TableCell align="right">{convertAndScale(parseFloat(item.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                            <TableCell align="right" >
                                                                <div style={{ color: '#444' }}>{convertAndScale(ytd).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                                <div style={{ fontSize: '0.75em', color: '#888' }}>{ytdUnit} unit</div>

                                                            </TableCell>
                                                            {months.map(month => {
                                                                const unit = parseFloat(item.units?.[month] || 0);
                                                                const lc = convertAndScale(parseFloat(item.values?.[month] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });
                                                                return (
                                                                    <TableCell key={`month-${month}-${idx}`} align="right">
                                                                        <div style={{ color: '#333' }}>{lc}</div>
                                                                        <div style={{ fontSize: '0.75em', color: '#999' }}>{unit} unit</div>
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

            )}
        </Box>
    );
};

export default ReportPPE;
