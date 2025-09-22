import { useEffect, useMemo, useState } from 'react';
import { useTripAssignment } from './hooks/useTripAssignment';
import { getCardItems } from '@/apis/cardItems/client';
import type { CardItem, GetCardItemsResponse } from '@/apis/cardItems/types';
import type { Trip } from '@/apis/trips/types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    Checkbox,
    Typography,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    useMediaQuery,
    LinearProgress,
    CircularProgress
} from '@mui/material';

interface TripAssignDialogProps {
    open: boolean;
    trip: Trip;
    onClose: () => void;
    onAssigned?: (count: number) => void;
}

export const TripAssignDialog: React.FC<TripAssignDialogProps> = ({ open, trip, onClose, onAssigned }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { assign } = useTripAssignment();
    const [items, setItems] = useState<Record<string, CardItem>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>();
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [category, setCategory] = useState<string>('Travel');
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [assigning, setAssigning] = useState<boolean>(false);

    const load = async () => {
        setLoading(true);
        setError(undefined);
        try {
            const effectiveStart = startDate || trip.startDate || undefined;
            const effectiveEnd = endDate || trip.endDate || undefined;
            const filter: NonNullable<Parameters<typeof getCardItems>[0]>['filter'] = {};
            if (effectiveStart) filter.startDate = effectiveStart;
            if (effectiveEnd) filter.endDate = effectiveEnd;
            if (category && category !== 'All') filter.category = category;
            const res = await getCardItems({ filter, pagination: { limit: 120 } });
            const data = (res?.data as GetCardItemsResponse) || { cardItems: {} };
            const raw = data.cardItems || {};
            // filter out items already assigned to this trip
            const filtered = Object.fromEntries(Object.entries(raw).filter(([, i]) => (i as CardItem).tripId !== trip.id));
            setItems(filtered);
            setSelected({});
            const cats = Array.from(new Set(Object.values(filtered).map(i => i.Category).filter(Boolean))).sort();
            setAvailableCategories(['All', ...cats]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (open) void load(); }, [open, trip.startDate, trip.endDate]);

    const itemsArray = useMemo(() => {
        const arr = Object.values(items).sort((a, b) => b.Date.localeCompare(a.Date));
        const q = search.trim().toLowerCase();
        return q ? arr.filter(i => (i.DisplayName || i.Name || '').toLowerCase().includes(q)) : arr;
    }, [items, search]);
    const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);

    const handleAssign = async () => {
        setAssigning(true);
        try {
            const res = await assign(trip.id, selectedIds);
            onAssigned?.(res.updatedCount);
            onClose();
        } finally {
            setAssigning(false);
        }
    };

    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" fullScreen={isMobile}>
            <DialogTitle>Assign Transactions to {trip.name}</DialogTitle>
            <DialogContent dividers>
                {(loading || assigning) && <LinearProgress sx={{ mb: 1 }} />}
                <Stack spacing={1.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <TextField
                            size="small"
                            label="Start date"
                            type="date"
                            value={startDate || trip.startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                            disabled={loading || assigning}
                        />
                        <TextField
                            size="small"
                            label="End date"
                            type="date"
                            value={endDate || trip.endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                            disabled={loading || assigning}
                        />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel id="trip-category-label">Category</InputLabel>
                            <Select
                                labelId="trip-category-label"
                                label="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as string)}
                                disabled={loading || assigning}
                            >
                                {availableCategories.map(c => (
                                    <MenuItem key={c} value={c}>{c}</MenuItem>
                                ))}
                                {availableCategories.length === 0 && (
                                    <MenuItem value="All">All</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <Button variant="outlined" onClick={load} sx={{ minHeight: 40 }} disabled={loading || assigning}>Apply</Button>
                        <Button variant="text" onClick={() => { setStartDate(''); setEndDate(''); setCategory('All'); setSearch(''); void load(); }} sx={{ minHeight: 40 }} disabled={loading || assigning}>Clear</Button>
                    </Stack>
                    <TextField
                        size="small"
                        placeholder="Search by name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">🔎</InputAdornment>
                        }}
                        disabled={loading || assigning}
                    />
                    {loading && <Typography>Loading...</Typography>}
                    {error && <Typography color="error">{error}</Typography>}
                    <TableContainer sx={{ maxHeight: 420 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedIds.length > 0 && selectedIds.length < itemsArray.length}
                                            checked={itemsArray.length > 0 && selectedIds.length === itemsArray.length}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSelected(() => itemsArray.reduce((acc, i) => { acc[i.id] = checked; return acc; }, {} as Record<string, boolean>));
                                            }}
                                            disabled={loading || assigning}
                                        />
                                    </TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell>Currency</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {itemsArray.map(i => (
                                    <TableRow key={i.id} hover>
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={!!selected[i.id]} onChange={(e) => setSelected(s => ({ ...s, [i.id]: e.target.checked }))} disabled={loading || assigning} />
                                        </TableCell>
                                        <TableCell>{fmtDate(i.Date)}</TableCell>
                                        <TableCell>{i.DisplayName || i.Name}</TableCell>
                                        <TableCell>{i.Category}</TableCell>
                                        <TableCell align="right">{i.Amount}</TableCell>
                                        <TableCell>{i.Currency}</TableCell>
                                    </TableRow>
                                ))}
                                {itemsArray.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography variant="body2" color="text.secondary">No results</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="text" sx={{ minHeight: 44 }} disabled={assigning}>Cancel</Button>
                <Button onClick={handleAssign} disabled={selectedIds.length === 0 || assigning} variant="contained" sx={{ minHeight: 44 }} startIcon={assigning ? <CircularProgress color="inherit" size={16} /> : undefined}>
                    {assigning ? 'Assigning…' : `Assign ${selectedIds.length} items`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};


