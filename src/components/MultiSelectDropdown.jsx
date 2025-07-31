import React, { useState, useMemo } from 'react';
import {
    Button,
    Checkbox,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Typography
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const MultiSelectDropdown = ({
    label,
    options = [],
    selected = [],
    onChange
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const open = Boolean(anchorEl);

    const allSelected = selected.length === options.length && options.length > 0;

    const handleToggle = (value) => {
        const exists = selected.includes(value);
        const newSelected = exists
            ? selected.filter((v) => v !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleSelectAllToggle = () => {
        if (allSelected) {
            onChange([]);
        } else {
            onChange(filteredOptions);
        }
    };

    const handleOpen = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => {
        setAnchorEl(null);
        setSearchTerm('');
    };

    const renderLabel = () => {
        if (selected.length === 0) return `Select ${label}`;
        if (allSelected) return `All ${label}`;
        return `${selected.length} selected`;
    };

    const filteredOptions = useMemo(() => {
        return options.filter((opt) =>
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                onClick={handleOpen}
                endIcon={<ArrowDropDownIcon />}
                sx={{ minWidth: 160 }}
            >
                {renderLabel()}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{ sx: { width: 240, maxHeight: 400 } }}
            >
                {options.length > 5 && (
                    <MenuItem disableRipple>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </MenuItem>
                )}

                <MenuItem onClick={handleSelectAllToggle}>
                    <Checkbox checked={allSelected} />
                    <ListItemText primary="Select All" />
                </MenuItem>

                {filteredOptions.map((opt) => (
                    <MenuItem key={opt} onClick={() => handleToggle(opt)}>
                        <Checkbox checked={selected.includes(opt)} />
                        <ListItemText primary={String(opt)} />
                    </MenuItem>
                ))}

                {filteredOptions.length === 0 && (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                            No match
                        </Typography>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default MultiSelectDropdown;
