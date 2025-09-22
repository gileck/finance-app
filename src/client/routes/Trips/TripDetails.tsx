import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/client/router';
import { getTripSummary } from '@/apis/trips/client';
import type { TripSummary, GetTripSummaryResponse } from '@/apis/trips/types';
import {
    Box,
    Button,
    Chip,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    LinearProgress,
    Skeleton,
    TableSortLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { ItemDetailsDialog } from '@/client/components/dashboard/ItemDetailsDialog';
import type { CardItem } from '@/apis/cardItems/types';
import { TripAssignDialog } from './TripAssignDialog';
import { useTripAssignment } from './hooks/useTripAssignment';

export const TripDetails: React.FC = () => {
    const { routeParams, navigate } = useRouter();
    const tripId = routeParams.id;
    const [summary, setSummary] = useState<TripSummary | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>();
    const [assignOpen, setAssignOpen] = useState<boolean>(false);

    const load = useCallback(async () => {
        if (!tripId) return;
        setLoading(true);
        setError(undefined);
        try {
            const res = await getTripSummary({ id: tripId });
            const data = (res?.data as GetTripSummaryResponse) || {};
            setSummary(data.summary);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    useEffect(() => {
        void load();
    }, [load]);

    // No theme/media query usage currently
    type SortBy = 'date' | 'name' | 'amount';
    type SortDirection = 'asc' | 'desc';
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortDirection] = useState<SortDirection>('desc');
    const { unassign } = useTripAssignment();
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
    const [detailsItem, setDetailsItem] = useState<CardItem | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; id?: string }>(() => ({ open: false }));

    const items = useMemo(() => {
        const arr = Object.values(summary?.items || {});
        const sorted = [...arr].sort((a, b) => {
            let av: number | string = 0;
            let bv: number | string = 0;
            if (sortBy === 'date') {
                av = new Date(a.Date).getTime();
                bv = new Date(b.Date).getTime();
            } else if (sortBy === 'name') {
                av = (a.DisplayName || a.Name || '').toLowerCase();
                bv = (b.DisplayName || b.Name || '').toLowerCase();
            } else {
                av = a.Amount;
                bv = b.Amount;
            }
            if (av < bv) return sortDirection === 'asc' ? -1 : 1;
            if (av > bv) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [summary, sortBy, sortDirection]);
    const currencyTotals = useMemo(() => Object.entries(summary?.totals.totalByCurrency || {}), [summary]);

    const fmt = (amount: number, currency: string) => {
        const rounded = Math.round(amount);
        if (currency.toUpperCase() === 'NIS' || currency.toUpperCase() === 'ILS' || currency === '₪') {
            return `₪${rounded.toLocaleString()}`;
        }
        return `${rounded.toLocaleString()} ${currency}`;
    };

    return (
        <Box sx={{ px: { xs: 2, sm: 2 }, py: { xs: 2, sm: 2 }, maxWidth: { xs: '100%', md: '980px' }, mx: 'auto', pb: { xs: 10, sm: 2 } }}>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {/* Header */}
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={1.5} mb={2.5}>
                <Box sx={{ minWidth: 0 }}>
                    {loading && !summary ? (
                        <Skeleton variant="text" width={180} height={36} />
                    ) : (
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                            {summary?.trip?.name || 'Trip'}
                        </Typography>
                    )}
                    {summary?.trip && (
                        <Box mt={0.5} display="flex" gap={1} flexWrap="wrap" alignItems="center">
                            {summary.trip.location && (
                                <Chip label={summary.trip.location} size="small" variant="outlined" />
                            )}
                            <Typography variant="body2" color="text.secondary">
                                {summary.trip.startDate}
                                <span style={{ margin: '0 6px' }}>→</span>
                                {summary.trip.endDate}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Box display={{ xs: 'none', md: 'flex' }} gap={1}>
                    {summary?.trip && (
                        <Button variant="contained" onClick={() => setAssignOpen(true)} sx={{ borderRadius: 2, minHeight: 44 }}>
                            Assign transactions
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Totals */}
            <Box display="flex" flexWrap="wrap" gap={2}>
                <Box sx={{ flex: '1 1 320px', maxWidth: { md: '50%' } }}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                        <Typography variant="subtitle2" color="text.secondary">Total (NIS)</Typography>
                        {loading && !summary ? (
                            <Skeleton variant="text" width={120} height={32} sx={{ mt: 0.5 }} />
                        ) : (
                            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                                {summary ? fmt(summary.totals.totalNis, 'NIS') : '—'}
                            </Typography>
                        )}
                        <Divider sx={{ my: 1.5 }} />
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {loading && !summary ? (
                                <Skeleton variant="rounded" width={80} height={28} />
                            ) : (
                                currencyTotals.map(([cur, total]) => (
                                    <Chip key={cur} label={`${cur}: ${fmt(total as number, cur)}`} size="small" />
                                ))
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Items table */}
            <Paper elevation={0} sx={{ mt: 2, p: { xs: 0.5, sm: 1 }, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
                <Box sx={{ px: 1, pt: 1, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">Transactions</Typography>
                    <IconButton aria-label="assign transactions" size="small" onClick={() => setAssignOpen(true)}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Box>
                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table size="small" stickyHeader={false} sx={{ minWidth: 480, tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: 84 }} />
                            <col style={{ width: '64%' }} />
                            <col style={{ width: 80 }} />
                            <col style={{ width: 72 }} />
                        </colgroup>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <TableSortLabel
                                        active={sortBy === 'date'}
                                        direction={sortBy === 'date' ? sortDirection : 'asc'}
                                        onClick={() => setSortBy('date')}
                                    >
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={sortBy === 'name'}
                                        direction={sortBy === 'name' ? sortDirection : 'asc'}
                                        onClick={() => setSortBy('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    <TableSortLabel
                                        active={sortBy === 'amount'}
                                        direction={sortBy === 'amount' ? sortDirection : 'asc'}
                                        onClick={() => setSortBy('amount')}
                                    >
                                        Amount
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">&nbsp;</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && !summary ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <TableRow key={`sk-${idx}`}>
                                        <TableCell><Skeleton width={72} /></TableCell>
                                        <TableCell><Skeleton width={160} /></TableCell>
                                        <TableCell align="right"><Skeleton width={80} sx={{ ml: 'auto' }} /></TableCell>
                                        <TableCell align="right"><Skeleton width={64} sx={{ ml: 'auto' }} /></TableCell>
                                    </TableRow>
                                ))
                            ) : items.map(i => (
                                <TableRow key={i.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(i.Date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</TableCell>
                                    <TableCell sx={{ overflow: 'hidden' }}>
                                        <Box display="flex" flexDirection="column" sx={{ minWidth: 0 }}>
                                            <Typography noWrap title={i.DisplayName || i.Name}>{i.DisplayName || i.Name}</Typography>
                                            {Array.isArray(i.Comments) && i.Comments.length > 0 && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
                                                    title={i.Comments.join(' • ')}
                                                >
                                                    {i.Comments.join(' • ')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{fmt(i.Amount, i.Currency)}</TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        <Box display="inline-flex" alignItems="center" gap={0.5} sx={{ whiteSpace: 'nowrap' }}>
                                            <IconButton aria-label="view details" size="small" onClick={() => { setDetailsItem(i as unknown as CardItem); setDetailsOpen(true); }}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton aria-label="delete item" size="small" onClick={() => setConfirmRemove({ open: true, id: i.id })}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Typography variant="body2" color="text.secondary">No transactions assigned</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Loading & error states */}
            {loading && (
                <Box mt={2}>
                    <Typography>Loading trip...</Typography>
                </Box>
            )}
            {!loading && error && (
                <Box mt={2}>
                    <Typography color="error">Error: {error}</Typography>
                </Box>
            )}

            {summary?.trip && (
                <TripAssignDialog
                    open={assignOpen}
                    trip={summary.trip}
                    onClose={() => setAssignOpen(false)}
                    onAssigned={async () => { setAssignOpen(false); await load(); }}
                />
            )}

            {/* Item full details dialog */}
            <ItemDetailsDialog
                open={detailsOpen}
                item={detailsItem as unknown as CardItem | null}
                onClose={() => { setDetailsOpen(false); setDetailsItem(null); }}
                onEdit={() => { /* edit could be implemented later */ }}
            />

            {/* Confirm remove from trip (not delete) */}
            <Dialog open={confirmRemove.open} onClose={() => setConfirmRemove({ open: false })}>
                <DialogTitle>Remove from Trip?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This will only unassign the transaction from this trip. The original card item will not be deleted.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmRemove({ open: false })}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={async () => { if (confirmRemove.id) { await unassign([confirmRemove.id]); await load(); } setConfirmRemove({ open: false }); }}>Remove</Button>
                </DialogActions>
            </Dialog>

            {/* Bottom action bar (iOS-style) */}
            <Box
                sx={{
                    position: 'sticky',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: { xs: 'flex', md: 'none' },
                    gap: 1,
                    py: 1,
                    backgroundColor: 'background.paper',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    zIndex: 1,
                    mt: 2,
                    px: 0,
                }}
            >
                <Button fullWidth variant="outlined" onClick={() => navigate('/trips')} sx={{ minHeight: 44, borderRadius: 2 }}>
                    Back
                </Button>
                <Button fullWidth disabled={!summary?.trip} variant="contained" onClick={() => setAssignOpen(true)} sx={{ minHeight: 44, borderRadius: 2 }}>
                    Assign
                </Button>
            </Box>
        </Box>
    );
};


