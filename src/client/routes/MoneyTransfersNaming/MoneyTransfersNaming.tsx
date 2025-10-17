import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Stack, TextField, Typography, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { getCardItems, updateCardItem } from '@/apis/cardItems/client';
import type { CardItem, GetCardItemsRequest } from '@/apis/cardItems/types';
import { CategorySelectionDialog } from '@/client/components/shared/CategorySelectionDialog';
import { ItemDetailsDialog } from '@/client/components/dashboard/ItemDetailsDialog';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { getCategoryColor } from '@/client/utils/categoryUtils';

type ItemsMap = Record<string, CardItem>;

const PAGE_MONTHS = 3;
const PAGE_TARGET_SIZE = 10;
const MONEY_TRANSFER_CATEGORY = 'Money Transfer';

export const MoneyTransfersNaming: React.FC = () => {
    const [items, setItems] = useState<ItemsMap>({});
    const [list, setList] = useState<CardItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [monthOffset, setMonthOffset] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [nameInput, setNameInput] = useState<string>('');
    const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<CardItem | null>(null);
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
    const [editOpen, setEditOpen] = useState<boolean>(false);
    const [savingPlus, setSavingPlus] = useState<boolean>(false);

    const buildRequest = useCallback((offset: number, limit: number): GetCardItemsRequest => {
        return {
            filter: {
                category: MONEY_TRANSFER_CATEGORY,
                sortBy: 'date',
                sortDirection: 'desc',
            },
            pagination: {
                limit,
                offset,
            }
        };
    }, []);

    const collectUnnamed = useCallback((map: ItemsMap): CardItem[] => {
        const arr = Object.values(map)
            .filter(i => i.Category === MONEY_TRANSFER_CATEGORY)
            .filter(i => !i.DisplayName || i.DisplayName.trim() === '')
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
        return arr;
    }, []);

    const fetchInitial = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let collected: ItemsMap = {};
            let offset = 0;
            let hasMoreMonths = true;

            while (Object.keys(collected).length < PAGE_TARGET_SIZE && hasMoreMonths) {
                const request = buildRequest(offset, PAGE_MONTHS);
                const res = await getCardItems(request);
                const pageItems = (res.data?.cardItems ?? {}) as ItemsMap;
                const pageHasMore = !!res.data?.hasMore;
                collected = { ...collected, ...pageItems };
                hasMoreMonths = pageHasMore;
                offset += PAGE_MONTHS;
                // Stop early if we already have enough unnamed items
                const unnamedNow = collectUnnamed(collected);
                if (unnamedNow.length >= PAGE_TARGET_SIZE) break;
            }

            setItems(collected);
            const unnamed = collectUnnamed(collected).slice(0, PAGE_TARGET_SIZE);
            setList(unnamed);
            setHasMore(hasMoreMonths);
            setMonthOffset(offset);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [buildRequest, collectUnnamed]);

    const loadMore = useCallback(async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        setError(null);
        try {
            let collected: ItemsMap = { ...items };
            let offset = monthOffset;
            let hasMoreMonths = hasMore;
            let addedUnnamed = 0;

            while (addedUnnamed < PAGE_TARGET_SIZE && hasMoreMonths) {
                const request = buildRequest(offset, PAGE_MONTHS);
                const res = await getCardItems(request);
                const pageItems = (res.data?.cardItems ?? {}) as ItemsMap;
                const pageHasMore = !!res.data?.hasMore;
                collected = { ...collected, ...pageItems };
                hasMoreMonths = pageHasMore;
                offset += PAGE_MONTHS;
                const unnamedNow = collectUnnamed(collected);
                addedUnnamed = unnamedNow.filter(i => !items[i.id]).length;
                if (unnamedNow.length - list.length >= PAGE_TARGET_SIZE) break;
            }

            setItems(collected);
            const unnamed = collectUnnamed(collected).slice(0, list.length + PAGE_TARGET_SIZE);
            setList(unnamed);
            setHasMore(hasMoreMonths);
            setMonthOffset(offset);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoadingMore(false);
        }
    }, [buildRequest, collectUnnamed, hasMore, items, list.length, loadingMore, monthOffset]);

    useEffect(() => {
        fetchInitial();
    }, [fetchInitial]);

    const onSetDisplayName = useCallback(async (item: CardItem, newName: string) => {
        const trimmed = (newName || '').trim();
        if (!trimmed) return;
        try {
            const updated: CardItem = { ...item, DisplayName: trimmed };
            const res = await updateCardItem({ cardItem: updated });
            if (res.data?.success) {
                // Remove item from view by updating local state
                setItems(prev => {
                    const next = { ...prev, [updated.id]: res.data?.cardItem as CardItem };
                    return next;
                });
                setList(prev => prev.filter(i => i.id !== item.id));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    const openPlusDialog = useCallback((item: CardItem) => {
        setActiveItem(item);
        setNameInput('');
        setSelectedCategory(null);
        setDialogOpen(true);
    }, []);

    const handleDialogClose = useCallback(() => {
        setDialogOpen(false);
        setActiveItem(null);
    }, []);

    const handleSubmitPlus = useCallback(async () => {
        if (!activeItem) return;
        const newName = nameInput.trim();
        const newCategory = selectedCategory || activeItem.Category;
        if (!newName) return;
        try {
            setSavingPlus(true);
            const updated: CardItem = { ...activeItem, DisplayName: newName, Category: newCategory };
            const res = await updateCardItem({ cardItem: updated });
            if (res.data?.success) {
                setItems(prev => ({ ...prev, [updated.id]: res.data?.cardItem as CardItem }));
                setList(prev => prev.filter(i => i.id !== activeItem.id));
                setDialogOpen(false);
                setActiveItem(null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSavingPlus(false);
        }
    }, [activeItem, nameInput, selectedCategory]);

    const renderComments = useCallback((item: CardItem) => {
        const commentsVal = item.Comments as unknown;
        const comments: string[] = Array.isArray(commentsVal)
            ? (commentsVal as Array<string>).filter(Boolean)
            : typeof commentsVal === 'string' && commentsVal.trim() !== ''
                ? [commentsVal]
                : [];
        if (comments.length === 0) return null;
        return (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                {comments.map((c, idx) => (
                    <Chip key={idx} label={c} size="small" onClick={() => onSetDisplayName(item, c)} />
                ))}
            </Stack>
        );
    }, [onSetDisplayName]);

    const formatCurrency = useCallback((amount: number, currency?: string) => {
        const code = (currency || 'NIS').toUpperCase();
        if (code === 'NIS' || code === 'ILS' || currency === '₪') {
            return `₪${Math.round(amount).toLocaleString()}`;
        }
        return `${Math.round(amount).toLocaleString()} ${currency || 'NIS'}`;
    }, []);

    const formatLocalDateTime = useCallback((iso: string) => {
        const d = new Date(iso);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }, []);

    const formatWeekday = useCallback((iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
    }, []);

    const content = useMemo(() => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }
        if (error) {
            return (
                <Box sx={{ color: 'error.main', mt: 2 }}>
                    <Typography variant="body2">{error}</Typography>
                </Box>
            );
        }
        return (
            <>
                <List>
                    {list.map(item => (
                        <ListItem key={item.id} alignItems="flex-start" divider onClick={() => { setActiveItem(item); setDetailsOpen(true); }} sx={{ cursor: 'pointer' }}>
                            <ListItemText
                                primary={
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Tooltip title={item.Category}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getCategoryColor(item.Category) }} />
                                        </Tooltip>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{item.DisplayName || item.Name}</Typography>
                                        <Typography variant="caption" sx={{ ml: 'auto', fontWeight: 700 }}>{formatCurrency(item.Amount, item.Currency)}</Typography>
                                    </Stack>
                                }
                                secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatWeekday(item.Date)} • {formatLocalDateTime(item.Date)}
                                        </Typography>
                                        {renderComments(item)}
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="add" onClick={() => openPlusDialog(item)}>
                                    <AddIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    {hasMore && (
                        <Button onClick={loadMore} disabled={loadingMore} variant="outlined">
                            {loadingMore ? 'Loading...' : 'Load More'}
                        </Button>
                    )}
                    {!hasMore && list.length === 0 && (
                        <Typography variant="body2" color="text.secondary">No items to rename.</Typography>
                    )}
                </Box>
            </>
        );
    }, [error, hasMore, list, loadMore, loading, loadingMore, renderComments, openPlusDialog, formatCurrency, formatLocalDateTime, formatWeekday]);

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h5" sx={{ flex: 1 }}>Money Transfers Naming</Typography>
                <IconButton size="small" onClick={() => fetchInitial()}>
                    <RefreshIcon fontSize="small" />
                </IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Click a comment to set it as the display name. Items disappear once named.
            </Typography>
            <Divider sx={{ my: 2 }} />
            {content}

            <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="xs" fullWidth>
                <DialogTitle>Set Display Name & Category</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Display Name"
                        fullWidth
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        margin="normal"
                        autoFocus
                        disabled={savingPlus}
                    />
                    <Button variant="outlined" onClick={() => setCategoryDialogOpen(true)} sx={{ mt: 1 }} disabled={savingPlus}>
                        {selectedCategory || 'Select Category'}
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} disabled={savingPlus}>Cancel</Button>
                    <Button onClick={handleSubmitPlus} variant="contained" disabled={!nameInput.trim() || savingPlus}>
                        {savingPlus ? <CircularProgress size={18} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <CategorySelectionDialog
                open={categoryDialogOpen}
                onClose={() => setCategoryDialogOpen(false)}
                onSelectCategory={(c) => { setSelectedCategory(c); setCategoryDialogOpen(false); }}
            />

            {/* Details + Edit dialogs */}
            {activeItem && (
                <ItemDetailsDialog
                    open={detailsOpen}
                    item={activeItem}
                    onClose={() => { setDetailsOpen(false); setActiveItem(null); }}
                    onEdit={() => { setEditOpen(true); setDetailsOpen(false); }}
                    onDelete={() => {/* not needed here */ }}
                />
            )}
            {activeItem && (
                <CardItemEditDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    cardItem={activeItem}
                    onSave={async (updated) => {
                        const res = await updateCardItem({ cardItem: updated });
                        if (res.data?.success && res.data.cardItem) {
                            setItems(prev => ({ ...prev, [updated.id]: res.data.cardItem as CardItem }));
                            // If now has DisplayName, remove from list
                            setList(prev => prev.filter(i => i.id !== updated.id));
                            setEditOpen(false);
                        }
                    }}
                />
            )}
        </Box>
    );
};


