import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Paper, Stack, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, CircularProgress, Tooltip, Collapse } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useRouter } from '../../router';
import { getCardItems } from '@/apis/cardItems/client';
import type { CardItem, GetCardItemsRequest, GetCardItemsResponse } from '@/apis/cardItems/types';
import type { CacheResult } from '@/server/cache/types';
import { useTheme, useMediaQuery } from '@mui/material';
import { ItemDetailsDialog } from '@/client/components/dashboard/ItemDetailsDialog';

export const Search: React.FC = () => {
    const { queryParams, navigate } = useRouter();
    const theme = useTheme();
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

    const [query, setQuery] = useState<string>(queryParams.q || '');
    const [startDate, setStartDate] = useState<string>(queryParams.startDate || '');
    const [endDate, setEndDate] = useState<string>(queryParams.endDate || '');
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<Record<string, CardItem>>({});
    const [hasMore, setHasMore] = useState<boolean>(false);

    type SortBy = 'date' | 'name' | 'amount';
    type SortDirection = 'asc' | 'desc';
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showAdvanced, setShowAdvanced] = useState<boolean>(!!(queryParams.startDate || queryParams.endDate));

    const canSearch = useMemo(() => query.trim().length > 0 || startDate || endDate, [query, startDate, endDate]);
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
    const [detailsItem, setDetailsItem] = useState<CardItem | null>(null);

    const performSearch = async (q: string, sd?: string, ed?: string) => {
        setLoading(true);
        try {
            const request: GetCardItemsRequest = {
                filter: {
                    searchTerm: q.trim() || undefined,
                    startDate: sd && sd.length > 0 ? sd : undefined,
                    endDate: ed && ed.length > 0 ? ed : undefined,
                    sortBy: 'date',
                    sortDirection: 'desc'
                },
            };
            const response: CacheResult<GetCardItemsResponse> = await getCardItems(request);
            setResults(response.data.cardItems);
            setHasMore(response.data.hasMore);
        } catch (e) {
            console.error('Search failed', e);
            setResults({});
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    // Run initial search from query params
    useEffect(() => {
        if (queryParams.q || queryParams.startDate || queryParams.endDate) {
            performSearch(queryParams.q || '', queryParams.startDate, queryParams.endDate);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Update URL with query params
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const path = params.toString() ? `/search?${params.toString()}` : '/search';
        navigate(path);
        performSearch(query, startDate, endDate);
    };

    const itemsArray = useMemo(() => Object.values(results), [results]);
    const sortedItems = useMemo(() => {
        const arr = [...itemsArray];
        arr.sort((a, b) => {
            let aVal: number | string = 0;
            let bVal: number | string = 0;
            switch (sortBy) {
                case 'date':
                    aVal = new Date(a.Date).getTime();
                    bVal = new Date(b.Date).getTime();
                    break;
                case 'name':
                    aVal = (a.DisplayName || a.Name || '').toLowerCase();
                    bVal = (b.DisplayName || b.Name || '').toLowerCase();
                    break;
                case 'amount':
                    aVal = a.Amount;
                    bVal = b.Amount;
                    break;
                default:
                    aVal = new Date(a.Date).getTime();
                    bVal = new Date(b.Date).getTime();
            }
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return arr;
    }, [itemsArray, sortBy, sortDirection]);

    const handleSort = (column: SortBy) => {
        if (sortBy === column) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDirection(column === 'date' ? 'desc' : 'asc');
        }
    };

    const formatCurrency = (value: number, currency?: string) => {
        const cur = (currency || 'NIS').toUpperCase();
        if (cur === 'NIS' || cur === 'ILS' || currency === '₪') {
            return `₪${Math.round(value).toLocaleString()}`;
        }
        return `${Math.round(value).toLocaleString()} ${currency || 'NIS'}`;
    };

    const resultCount = Object.keys(results).length;

    return (
        <Container maxWidth="md" sx={{ py: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Search</Typography>
                {resultCount > 0 && (
                    <Typography variant="subtitle2" color="text.secondary">{resultCount.toLocaleString()} results</Typography>
                )}
            </Box>

            <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider' }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={1.5}>
                        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <TextField
                                label="Search"
                                placeholder="Type a name or comment"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                fullWidth
                                InputProps={{
                                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button type="button" variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowAdvanced(v => !v)} sx={{ minHeight: 44 }} color={showAdvanced ? 'secondary' : 'primary'}>
                                    {showAdvanced ? 'Hide advanced' : 'Advanced search'}
                                </Button>
                                <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled={!canSearch || loading} sx={{ minHeight: 44 }}>
                                    {loading ? 'Searching...' : 'Search'}
                                </Button>
                            </Box>
                        </Stack>
                        <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ pt: 0.5 }}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: <CalendarMonthIcon color="action" sx={{ mr: 1 }} />
                                    }}
                                    sx={{ maxWidth: 220 }}
                                />
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: <CalendarMonthIcon color="action" sx={{ mr: 1 }} />
                                    }}
                                    sx={{ maxWidth: 220 }}
                                />
                            </Stack>
                        </Collapse>
                    </Stack>
                </Box>
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : Object.keys(results).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No results</Typography>
            ) : (
                <TableContainer component="div" sx={{ width: '100%', p: 0, m: 0, boxShadow: 'none', backgroundColor: 'transparent', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" stickyHeader sx={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                        <colgroup>
                            <col style={{ width: isSmUp ? 110 : 72 }} />
                            <col style={{ width: 'auto' }} />
                            <col style={{ width: isSmUp ? '11ch' : '10ch' }} />
                        </colgroup>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'background.paper' }}>
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
                                            width: '100%'
                                        }}
                                    >
                                        Amount
                                    </TableSortLabel>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedItems.map((item) => (
                                <TableRow key={item.id} hover onClick={() => { setDetailsItem(item); setDetailsOpen(true); }} sx={{ cursor: 'pointer', '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                                    <TableCell sx={{ borderBottom: 'none', whiteSpace: 'nowrap' }} align="left">{(() => { const d = new Date(item.Date); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0'); const yy = String(d.getFullYear()).slice(-2); return `${dd}/${mm}/${yy}`; })()}</TableCell>
                                    <TableCell sx={{ overflow: 'hidden', borderBottom: 'none' }} align="left">
                                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.DisplayName || item.Name}
                                                </Typography>
                                                {item.PendingTransaction && (
                                                    <Tooltip title="Pending Transaction" arrow>
                                                        <ErrorOutlineIcon color="warning" fontSize="small" />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {Array.isArray(item.Comments) && item.Comments.length > 0 ? item.Comments.join(' • ') : ''}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderBottom: 'none', whiteSpace: 'nowrap', px: 0.5 }}>{formatCurrency(item.Amount, item.Currency)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {hasMore && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Showing first page of results</Typography>
                    )}
                </TableContainer>
            )}

            {/* Item Details Dialog */}
            <ItemDetailsDialog
                open={detailsOpen}
                item={detailsItem}
                onClose={() => { setDetailsOpen(false); setDetailsItem(null); }}
                onEdit={() => { /* edit can be added later */ }}
                onDelete={(id) => {
                    setResults(prev => {
                        const copy = { ...prev };
                        delete copy[id];
                        return copy;
                    });
                }}
            />
        </Container>
    );
};


