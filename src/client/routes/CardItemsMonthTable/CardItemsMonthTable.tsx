import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Container,
    Paper,
    Box,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    TableSortLabel,
    Toolbar,
    TextField,
    InputAdornment,
    IconButton,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    OutlinedInput,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { getCardItems } from '@/apis/cardItems/client';
import { CardItem } from '@/apis/cardItems/types';
import { useRouter } from '@/client/router';
import { ItemDetailsDialog } from '@/client/components/dashboard/ItemDetailsDialog';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem as updateCardItemApi } from '@/client/utils/cardItemOperations';

type SortBy = 'date' | 'amount' | 'category' | 'name';
type SortDirection = 'asc' | 'desc';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const formatCurrency = (value: number, currency?: string) => {
    const cur = (currency || 'NIS').toUpperCase();
    if (cur === 'NIS' || cur === 'ILS' || currency === '₪') {
        return `₪${Math.round(value).toLocaleString()}`;
    }
    return `${Math.round(value).toLocaleString()} ${currency || 'NIS'}`;
};

export const CardItemsMonthTable: React.FC = () => {
    const theme = useTheme();
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
    const router = useRouter();
    const initialYear = useMemo(() => {
        const qpYear = parseInt(router.queryParams.year || '');
        return Number.isFinite(qpYear) ? qpYear : new Date().getFullYear();
    }, [router.queryParams.year]);
    const initialMonth = useMemo(() => {
        const qpMonth = parseInt(router.queryParams.month || '');
        return Number.isFinite(qpMonth) && qpMonth >= 1 && qpMonth <= 12 ? qpMonth : new Date().getMonth() + 1;
    }, [router.queryParams.month]);

    const [year, setYear] = useState<number>(initialYear);
    const [month, setMonth] = useState<number>(initialMonth); // 1-12
    const [monthDialogOpen, setMonthDialogOpen] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<CardItem[]>([]); // original month items

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');
    const [showFilters, setShowFilters] = useState<boolean>(false);

    // Sync local state with query params
    useEffect(() => {
        setYear(initialYear);
        setMonth(initialMonth);
    }, [initialYear, initialMonth]);

    const updateUrl = useCallback((y: number, m: number) => {
        router.navigate(`/card-items-month-table?year=${y}&month=${String(m).padStart(2, '0')}`);
    }, [router]);

    const handlePrevMonth = () => {
        const date = new Date(year, month - 2, 1);
        const newY = date.getFullYear();
        const newM = date.getMonth() + 1;
        setYear(newY);
        setMonth(newM);
        updateUrl(newY, newM);
    };

    const handleNextMonth = () => {
        const date = new Date(year, month, 1);
        const newY = date.getFullYear();
        const newM = date.getMonth() + 1;
        setYear(newY);
        setMonth(newM);
        updateUrl(newY, newM);
    };

    const handleMonthSelect = (event: any) => {
        const newM = Number(event.target.value);
        setMonth(newM);
        updateUrl(year, newM);
    };

    const handleYearSelect = (event: any) => {
        const newY = Number(event.target.value);
        setYear(newY);
        updateUrl(newY, month);
    };

    const startDate = useMemo(() => new Date(year, month - 1, 1).toISOString().split('T')[0], [year, month]);
    const endDate = useMemo(() => new Date(year, month, 0).toISOString().split('T')[0], [year, month]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await getCardItems({
                filter: {
                    startDate,
                    endDate,
                    // fetch only by date range; all filtering/sorting is client-side
                }
            });

            if (resp.data.error) {
                setError(resp.data.error);
                setItems([]);
            } else {
                const arr = Object.values(resp.data.cardItems || {});
                setItems(arr);
                const cats = Array.from(new Set(arr.map(i => i.Category).filter(Boolean))).sort();
                setAvailableCategories(cats);
            }
        } catch (e) {
            setError(`Failed to fetch items: ${e instanceof Error ? e.message : String(e)}`);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Derived filtered and sorted items (client-side only)
    const filteredSortedItems = useMemo(() => {
        let result = items;

        // Search by name
        const term = searchTerm.trim().toLowerCase();
        if (term) {
            result = result.filter(i => (i.DisplayName || i.Name || '').toLowerCase().includes(term));
        }

        // Category filter (single)
        if (selectedCategory) {
            result = result.filter(i => i.Category === selectedCategory);
        }

        // Amount range
        const min = minAmount !== '' ? Number(minAmount) : null;
        const max = maxAmount !== '' ? Number(maxAmount) : null;
        if (min !== null) {
            result = result.filter(i => i.Amount >= min);
        }
        if (max !== null) {
            result = result.filter(i => i.Amount <= max);
        }

        // Sort
        const sorted = [...result].sort((a, b) => {
            let aValue: any;
            let bValue: any;
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.Date).getTime();
                    bValue = new Date(b.Date).getTime();
                    break;
                case 'amount':
                    aValue = a.Amount;
                    bValue = b.Amount;
                    break;
                case 'category':
                    aValue = (a.Category || '').toLowerCase();
                    bValue = (b.Category || '').toLowerCase();
                    break;
                case 'name':
                    aValue = (a.DisplayName || a.Name || '').toLowerCase();
                    bValue = (b.DisplayName || b.Name || '').toLowerCase();
                    break;
                default:
                    aValue = new Date(a.Date).getTime();
                    bValue = new Date(b.Date).getTime();
            }
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [items, searchTerm, selectedCategory, minAmount, maxAmount, sortBy, sortDirection]);

    // Reserve fixed space for edge columns; keep Amount tight and centered
    const dateColWidth = isSmUp ? 110 : 72;
    const amountColWidth = isSmUp ? '11ch' : '10ch';

    // Item details dialog state
    const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);

    const handleRowClick = (item: CardItem) => {
        setSelectedItem(item);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetailsDialog = () => {
        setDetailsDialogOpen(false);
        setSelectedItem(null);
    };

    const handleEditFromDetails = (item: CardItem) => {
        setDetailsDialogOpen(false);
        setEditItem(item);
        setEditDialogOpen(true);
    };

    // Edit dialog state and handlers
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [editItem, setEditItem] = useState<CardItem | null>(null);

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setEditItem(null);
    };

    const handleSaveChanges = async (updated: CardItem) => {
        const result = await updateCardItemApi(updated);
        if (result.success) {
            // Update local items array
            setItems(prev => prev.map(i => (i.id === updated.id ? { ...updated } : i)));
            // Update available categories
            const cats = Array.from(new Set((items.map(i => (i.id === updated.id ? updated : i)).map(i => i.Category).filter(Boolean)))).sort();
            setAvailableCategories(cats);
        }
        setEditDialogOpen(false);
        setEditItem(null);
    };

    const handleSort = (column: SortBy) => {
        if (sortBy === column) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDirection(column === 'date' ? 'desc' : 'asc');
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setMinAmount('');
        setMaxAmount('');
        setSortBy('date');
        setSortDirection('desc');
    };

    return (
        <Container maxWidth="lg">
            <Box mt={0} mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
                <IconButton aria-label="Previous month" onClick={handlePrevMonth} sx={{ width: 44, height: 44 }}>
                    <NavigateBeforeIcon />
                </IconButton>
                <Typography variant="h4"
                    component="h1"
                    sx={{ fontSize: { xs: 'clamp(20px, 5vw, 24px)', sm: 'clamp(24px, 3.2vw, 32px)' }, fontWeight: 700 }}>
                    {monthNames[month - 1]} {year}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                    <IconButton aria-label="Open month picker" onClick={() => setMonthDialogOpen(true)} sx={{ width: 36, height: 36 }}>
                        <CalendarMonthIcon />
                    </IconButton>
                    <IconButton aria-label="Next month" onClick={handleNextMonth} sx={{ width: 44, height: 44 }}>
                        <NavigateNextIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ mx: { xs: -2, sm: -3 } }}>
                <Paper elevation={0} square sx={{ boxShadow: 'none', borderRadius: 0 }}>
                    <Toolbar
                        sx={{
                            gap: 1.5,
                            flexWrap: 'wrap',
                            p: 1.5,
                            position: { xs: 'sticky', sm: 'static' },
                            top: 0,
                            zIndex: 1,
                            backdropFilter: { xs: 'blur(12px)', sm: 'none' },
                            WebkitBackdropFilter: { xs: 'blur(12px)', sm: 'none' },
                            backgroundColor: 'background.paper',
                            borderBottom: { xs: '1px solid', sm: 'none' },
                            borderColor: { xs: 'divider', sm: 'transparent' }
                        }}
                    >
                        <TextField
                            size="small"
                            label="Search by name"
                            placeholder="Type a name and press Enter"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            // Client-side filtering, no request on Enter
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ flex: '1 1 260px', minWidth: { xs: 200, sm: 260 } }}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FilterListIcon />}
                            onClick={() => setShowFilters(prev => !prev)}
                            aria-expanded={showFilters}
                            aria-controls="filters-panel"
                            sx={{ minHeight: 44 }}
                        >
                            Filters
                        </Button>
                    </Toolbar>

                    <Collapse in={showFilters} timeout="auto" unmountOnExit>
                        <Box id="filters-panel" px={2} pb={2} display="flex" flexWrap="wrap" gap={1.5}>
                            <FormControl size="small" sx={{ minWidth: 240, flex: '1 1 240px' }}>
                                <InputLabel id="category-single-label">Category</InputLabel>
                                <Select
                                    labelId="category-single-label"
                                    id="category-select"
                                    value={selectedCategory}
                                    label="Category"
                                    onChange={(e) => { setSelectedCategory(e.target.value as string); }}
                                >
                                    <MenuItem value="">
                                        <em>All</em>
                                    </MenuItem>
                                    {availableCategories.map((c) => (
                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                type="number"
                                label="Min Amount"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 160 } }}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="Max Amount"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 160 } }}
                            />

                            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                                <Button variant="outlined" size="small" startIcon={<RestartAltIcon />} onClick={handleResetFilters} sx={{ minHeight: 44 }}>
                                    Reset
                                </Button>
                                <Button variant="contained" size="small" onClick={() => setShowFilters(false)} sx={{ minHeight: 44 }}>
                                    Done
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>

                    {error && (
                        <Box px={2} pb={2}>
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    )}

                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer component="div" sx={{ width: '100%', p: 0, m: 0, boxShadow: 'none', backgroundColor: 'transparent' }}>
                            <Table size="small" sx={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                                <colgroup>
                                    <col style={{ width: dateColWidth }} />
                                    <col style={{ width: 'auto' }} />
                                    <col style={{ width: amountColWidth }} />
                                </colgroup>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sortDirection={sortBy === 'date' ? sortDirection : false} sx={{ borderBottom: 'none', whiteSpace: 'nowrap' }} align="left">
                                            <TableSortLabel
                                                active={sortBy === 'date'}
                                                direction={sortBy === 'date' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('date')}
                                            >
                                                Date
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sortDirection={sortBy === 'name' ? sortDirection : false} sx={{ borderBottom: 'none' }} align="left">
                                            <TableSortLabel
                                                active={sortBy === 'name'}
                                                direction={sortBy === 'name' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('name')}
                                            >
                                                Name
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell align="center" sortDirection={sortBy === 'amount' ? sortDirection : false} sx={{ borderBottom: 'none', whiteSpace: 'nowrap', px: 0 }}>
                                            <TableSortLabel
                                                active={sortBy === 'amount'}
                                                direction={sortBy === 'amount' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('amount')}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    paddingLeft: sortBy === 'amount' ? 0 : '25px'

                                                }}
                                            >
                                                Amount
                                            </TableSortLabel>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredSortedItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ borderBottom: 'none' }}>
                                                <Typography color="text.secondary" py={2}>No results</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSortedItems.map(item => (
                                            <TableRow
                                                key={item.id}
                                                hover
                                                onClick={() => handleRowClick(item)}
                                                sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' }, cursor: 'pointer' }}
                                            >
                                                <TableCell sx={{ borderBottom: 'none', whiteSpace: 'nowrap' }} align="left">{new Date(item.Date).toLocaleString('default', { month: 'short', day: 'numeric' })}</TableCell>
                                                <TableCell sx={{ overflow: 'hidden', borderBottom: 'none' }} align="left">
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.DisplayName || item.Name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.Category || '-'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ borderBottom: 'none', whiteSpace: 'nowrap', px: 0.5 }}>{formatCurrency(item.Amount, item.Currency)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Box>

            {/* Month Picker Dialog */}
            <Dialog open={monthDialogOpen} onClose={() => setMonthDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Select Month</DialogTitle>
                <DialogContent>
                    <Box display="flex" gap={2} mt={1}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="month-select-label">Month</InputLabel>
                            <Select
                                labelId="month-select-label"
                                value={month}
                                label="Month"
                                onChange={handleMonthSelect}
                            >
                                {monthNames.map((m, idx) => (
                                    <MenuItem key={m} value={idx + 1}>{m}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                            <InputLabel id="year-select-label">Year</InputLabel>
                            <Select
                                labelId="year-select-label"
                                value={year}
                                label="Year"
                                onChange={handleYearSelect}
                            >
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const y = new Date().getFullYear() - 8 + i; // 9 years span
                                    return <MenuItem key={y} value={y}>{y}</MenuItem>;
                                })}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMonthDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Item Details Dialog */}
            <ItemDetailsDialog
                open={detailsDialogOpen}
                item={selectedItem}
                onClose={handleCloseDetailsDialog}
                onEdit={handleEditFromDetails}
            />

            {/* Edit Dialog */}
            {editItem && (
                <CardItemEditDialog
                    open={editDialogOpen}
                    onClose={handleCloseEditDialog}
                    cardItem={editItem}
                    onSave={handleSaveChanges}
                />
            )}
        </Container>
    );
};

export default CardItemsMonthTable;


