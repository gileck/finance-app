import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Box,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
  InputAdornment,
  Stack,
  CircularProgress
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format, parse, isValid } from 'date-fns';

export interface FilterOptions {
  categories?: string[];
  startDate?: Date | null;
  endDate?: Date | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  searchTerm?: string;
  sortBy?: 'date' | 'amount' | 'category' | 'name';
  sortDirection?: 'asc' | 'desc';
  pendingTransactionOnly?: boolean;
  hasVersion?: boolean | null;
  specificVersion?: string;
}

interface AdvancedFilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  availableCategories: string[];
  currentFilters: FilterOptions;
  disabled?: boolean;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const AdvancedFilterDialog: React.FC<AdvancedFilterDialogProps> = ({
  open,
  onClose,
  onApplyFilters,
  availableCategories,
  currentFilters,
  disabled = false
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [startDateStr, setStartDateStr] = useState<string>(
    filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''
  );
  const [endDateStr, setEndDateStr] = useState<string>(
    filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''
  );
  const [dateError, setDateError] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [versionFilterType, setVersionFilterType] = useState<string>(
    filters.hasVersion === true
      ? 'has'
      : filters.hasVersion === false
        ? 'none'
        : filters.specificVersion && filters.specificVersion.trim() !== ''
          ? 'specific'
          : ''
  );

  // Reset filters when dialog opens with current filters
  useEffect(() => {
    if (open) {
      setFilters(currentFilters);
      setStartDateStr(currentFilters.startDate ? format(currentFilters.startDate, 'yyyy-MM-dd') : '');
      setEndDateStr(currentFilters.endDate ? format(currentFilters.endDate, 'yyyy-MM-dd') : '');
      setDateError({ start: '', end: '' });
      setVersionFilterType(
        currentFilters.hasVersion === true
          ? 'has'
          : currentFilters.hasVersion === false
            ? 'none'
            : currentFilters.specificVersion && currentFilters.specificVersion.trim() !== ''
              ? 'specific'
              : ''
      );
    }
  }, [open, currentFilters]);

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters({
      ...filters,
      categories: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStartDateStr(value);

    if (!value) {
      setFilters({
        ...filters,
        startDate: null
      });
      setDateError({ ...dateError, start: '' });
      return;
    }

    const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      setFilters({
        ...filters,
        startDate: parsedDate
      });
      setDateError({ ...dateError, start: '' });
    } else {
      setDateError({ ...dateError, start: 'Invalid date format' });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEndDateStr(value);

    if (!value) {
      setFilters({
        ...filters,
        endDate: null
      });
      setDateError({ ...dateError, end: '' });
      return;
    }

    const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      setFilters({
        ...filters,
        endDate: parsedDate
      });
      setDateError({ ...dateError, end: '' });
    } else {
      setDateError({ ...dateError, end: 'Invalid date format' });
    }
  };

  const handleAmountChange = (field: 'minAmount' | 'maxAmount', value: string) => {
    const numValue = value === '' ? null : Number(value);
    setFilters({
      ...filters,
      [field]: numValue,
    });
  };

  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      searchTerm: event.target.value,
    });
  };

  const handleSortByChange = (event: SelectChangeEvent) => {
    setFilters({
      ...filters,
      sortBy: event.target.value as 'date' | 'amount' | 'category' | 'name',
    });
  };

  const handleSortDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      sortDirection: event.target.checked ? 'desc' : 'asc',
    });
  };

  const handlePendingTransactionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      pendingTransactionOnly: event.target.checked,
    });
  };

  const handleVersionFilterChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setVersionFilterType(value);

    if (value === 'has') {
      setFilters({
        ...filters,
        hasVersion: true,
        specificVersion: '',
      });
    } else if (value === 'none') {
      setFilters({
        ...filters,
        hasVersion: false,
        specificVersion: '',
      });
    } else if (value === 'specific') {
      setFilters({
        ...filters,
        hasVersion: null,
        specificVersion: filters.specificVersion || '',
      });
    } else {
      // No filter selected
      setFilters({
        ...filters,
        hasVersion: null,
        specificVersion: '',
      });
    }
  };

  const handleSpecificVersionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      specificVersion: event.target.value,
    });
  };

  const handleReset = () => {
    setFilters({
      categories: [],
      startDate: null,
      endDate: null,
      minAmount: null,
      maxAmount: null,
      searchTerm: '',
      sortBy: 'date',
      sortDirection: 'desc',
      pendingTransactionOnly: false,
      hasVersion: null,
      specificVersion: '',
    });
    setStartDateStr('');
    setEndDateStr('');
    setDateError({ start: '', end: '' });
    setVersionFilterType('');
  };

  const handleApply = () => {
    // Validate that there are no date errors before applying
    if (dateError.start || dateError.end) {
      return;
    }

    onApplyFilters(filters);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={disabled ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        py: 2
      }}>
        <FilterListIcon />
        <Typography variant="h6">Advanced Filters</Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Date Range */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Date Range
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={startDateStr}
                onChange={handleStartDateChange}
                error={!!dateError.start}
                helperText={dateError.start}
                disabled={disabled}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={endDateStr}
                onChange={handleEndDateChange}
                error={!!dateError.end}
                helperText={dateError.end}
                disabled={disabled}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Amount Range */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Amount Range
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Min Amount"
                type="number"
                fullWidth
                value={filters.minAmount === null ? '' : filters.minAmount}
                onChange={(e) => handleAmountChange('minAmount', e.target.value)}
                disabled={disabled}
                InputProps={{
                  inputProps: { min: 0 },
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
              <TextField
                label="Max Amount"
                type="number"
                fullWidth
                value={filters.maxAmount === null ? '' : filters.maxAmount}
                onChange={(e) => handleAmountChange('maxAmount', e.target.value)}
                disabled={disabled}
                InputProps={{
                  inputProps: { min: 0 },
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Categories */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Categories
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="categories-label">Select Categories</InputLabel>
              <Select
                labelId="categories-label"
                multiple
                value={filters.categories || []}
                onChange={handleCategoryChange}
                input={<OutlinedInput label="Select Categories" />}
                disabled={disabled}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    <Checkbox checked={(filters.categories || []).indexOf(category) > -1} />
                    <ListItemText primary={category} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider />

          {/* Search Term */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Search
            </Typography>
            <TextField
              label="Search by Name or Comments"
              fullWidth
              value={filters.searchTerm || ''}
              onChange={handleSearchTermChange}
              disabled={disabled}
            />
          </Box>

          <Divider />

          {/* Sorting */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Sorting
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl fullWidth>
                <InputLabel id="sort-by-label">Sort By</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={filters.sortBy || 'date'}
                  onChange={handleSortByChange}
                  label="Sort By"
                  disabled={disabled}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.sortDirection === 'desc'}
                    onChange={handleSortDirectionChange}
                    disabled={disabled}
                  />
                }
                label={filters.sortDirection === 'desc' ? "Descending" : "Ascending"}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Pending Transaction */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.pendingTransactionOnly || false}
                  onChange={handlePendingTransactionChange}
                  disabled={disabled}
                />
              }
              label="Pending Transaction Only"
            />
          </Box>

          {/* Version Filter */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Version Filter
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="version-filter-label">Version Filter</InputLabel>
              <Select
                labelId="version-filter-label"
                value={versionFilterType}
                onChange={handleVersionFilterChange}
                label="Version Filter"
                disabled={disabled}
              >
                <MenuItem value="">No Filter</MenuItem>
                <MenuItem value="has">Has Version</MenuItem>
                <MenuItem value="none">No Version</MenuItem>
                <MenuItem value="specific">Specific Version</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Specific Version - only show when specific is selected */}
          {versionFilterType === 'specific' && (
            <Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Specific Version
              </Typography>
              <TextField
                label="Enter Version"
                fullWidth
                value={filters.specificVersion || ''}
                onChange={handleSpecificVersionChange}
                placeholder="e.g., 1.0.0"
                disabled={disabled}
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleReset}
          variant="outlined"
          color="secondary"
          disabled={disabled}
        >
          Reset Filters
        </Button>
        <Box>
          <Button
            onClick={onClose}
            color="primary"
            sx={{ mr: 1 }}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            variant="contained"
            color="primary"
            disabled={!!dateError.start || !!dateError.end || disabled}
            startIcon={disabled ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {disabled ? 'Applying...' : 'Apply Filters'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
