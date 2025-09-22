import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { alpha, useTheme } from '@mui/material/styles';
import { getCardItems } from '@/apis/cardItems/client';
import { CardItem, GetCardItemsRequest } from '@/apis/cardItems/types';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { ItemDetailsDialog } from '@/client/components/dashboard/ItemDetailsDialog';
import { deleteCardItem, updateCardItem } from '@/client/utils/cardItemOperations';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { format } from 'date-fns';

const PAGE_LIMIT_MONTHS = 2;

export const PendingItems: React.FC = () => {
    const theme = useTheme();

    // Data stores
    const [allItems, setAllItems] = useState<Record<string, CardItem>>({});
    const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);
    const [pendingItemsMap, setPendingItemsMap] = useState<Record<string, CardItem>>({});
    const [pendingLoaded, setPendingLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Dialogs / selection
    const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Matches dialog
    const [matchesDialogOpen, setMatchesDialogOpen] = useState<boolean>(false);
    const [matchedItems, setMatchedItems] = useState<CardItem[]>([]);
    const [matchDateKey, setMatchDateKey] = useState<string | null>(null);

    const pendingItems = useMemo(() => {
        const items = Object.values(pendingItemsMap);
        // Newest first, show only last 10
        return items
            .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
            .slice(0, 10);
    }, [pendingItemsMap]);

    const getDateKey = (dateStr: string): string => {
        const d = new Date(dateStr);
        return d.toDateString();
    };

    const getNormalizedName = (item: CardItem): string => {
        const name = (item.DisplayName || item.Name || '').trim().toLowerCase();
        return name;
    };

    // Validation: same day + same name + same amount (unless amount is 0, then ignore amount)
    const hasValidMatch = useCallback((pendingItem: CardItem): boolean => {
        const all = Object.values(allItems);
        const pendingDateKey = getDateKey(pendingItem.Date);
        const pendingName = getNormalizedName(pendingItem);
        const pendingAmount = pendingItem.Amount;
        const pendingCurrency = pendingItem.Currency;

        return all.some(other => {
            if (other.id === pendingItem.id) return false;
            if (other.PendingTransaction) return false;
            if (other.Currency !== pendingCurrency) return false;
            const sameDate = getDateKey(other.Date) === pendingDateKey;
            const sameName = getNormalizedName(other) === pendingName;
            if (pendingAmount === 0) {
                return sameDate && sameName;
            }
            const sameAmount = other.Amount === pendingAmount;
            return sameAmount && sameDate && sameName;
        });
    }, [allItems]);

    // Fetch helpers
    const buildRequest = (offset: number, limit: number, pendingOnly: boolean): GetCardItemsRequest => {
        const filter: NonNullable<GetCardItemsRequest['filter']> = {};
        if (pendingOnly) {
            filter.pendingTransactionOnly = true;
        }
        return {
            pagination: { limit, offset },
            filter
        };
    };

    const fetchAllPending = useCallback(async () => {
        setPendingLoaded(false);
        setError(null);
        let offset = 0;
        let hasMore = true;
        const collected: Record<string, CardItem> = {};
        try {
            while (hasMore) {
                const req = buildRequest(offset, PAGE_LIMIT_MONTHS, true);
                const res = await getCardItems(req);
                if (res.data.error) {
                    throw new Error(res.data.error);
                }
                Object.assign(collected, res.data.cardItems);
                hasMore = res.data.hasMore;
                offset += PAGE_LIMIT_MONTHS;
            }
            setPendingItemsMap(collected);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setPendingLoaded(true);
        }
    }, []);

    const fetchAllItems = useCallback(async () => {
        setAllItemsLoaded(false);
        setError(null);
        let offset = 0;
        let hasMore = true;
        const collected: Record<string, CardItem> = {};
        try {
            while (hasMore) {
                const req = buildRequest(offset, PAGE_LIMIT_MONTHS, false);
                const res = await getCardItems(req);
                if (res.data.error) {
                    throw new Error(res.data.error);
                }
                Object.assign(collected, res.data.cardItems);
                hasMore = res.data.hasMore;
                offset += PAGE_LIMIT_MONTHS;
            }
            setAllItems(collected);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setAllItemsLoaded(true);
        }
    }, []);

    useEffect(() => {
        void fetchAllPending();
        void fetchAllItems();
    }, [fetchAllPending, fetchAllItems]);

    const handleItemClick = (item: CardItem) => {
        setSelectedItem(item);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetailsDialog = () => {
        setDetailsDialogOpen(false);
        setSelectedItem(null);
    };

    const handleEditClick = (item: CardItem) => {
        setDetailsDialogOpen(false);
        setSelectedItem(item);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedItem(null);
    };

    const handleSaveChanges = async (updatedItem: CardItem): Promise<void> => {
        const res = await updateCardItem(updatedItem);
        if (res.success && res.updatedItem) {
            setAllItems(prev => ({ ...prev, [updatedItem.id]: updatedItem }));
            if (updatedItem.PendingTransaction) {
                setPendingItemsMap(prev => ({ ...prev, [updatedItem.id]: updatedItem }));
            }
        }
        setEditDialogOpen(false);
        setSelectedItem(null);
    };

    const handleDeletePending = async (item: CardItem, e?: React.MouseEvent): Promise<void> => {
        if (e) e.stopPropagation();
        if (deletingId) return;
        setDeletingId(item.id);
        try {
            const result = await deleteCardItem(item.id);
            if (result.success) {
                setPendingItemsMap(prev => {
                    const copy = { ...prev };
                    delete copy[item.id];
                    return copy;
                });
                setAllItems(prev => {
                    const copy = { ...prev };
                    delete copy[item.id];
                    return copy;
                });
            } else {
                console.error('Failed to delete card item:', result.message);
            }
        } finally {
            setDeletingId(null);
        }
    };

    const openMatchesForItem = (item: CardItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const dateKey = getDateKey(item.Date);
        const items = Object.values(allItems).filter(i => getDateKey(i.Date) === dateKey);
        setMatchedItems(items.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime()));
        setMatchDateKey(dateKey);
        setMatchesDialogOpen(true);
    };

    const closeMatchesDialog = () => {
        setMatchesDialogOpen(false);
        setMatchedItems([]);
        setMatchDateKey(null);
    };

    const renderValidationIcon = (item: CardItem) => {
        if (!allItemsLoaded) {
            return (
                <Tooltip title="Validating...">
                    <Box display="flex" alignItems="center" sx={{ color: theme.palette.text.secondary }}>
                        <CircularProgress size={16} />
                    </Box>
                </Tooltip>
            );
        }
        const isValid = hasValidMatch(item);
        return (
            <Tooltip title={isValid ? 'Valid match found' : 'No matching cleared item'}>
                <IconButton
                    size="small"
                    onClick={(e) => openMatchesForItem(item, e)}
                    sx={{ color: isValid ? theme.palette.success.main : theme.palette.error.main }}
                >
                    {isValid ? (
                        <CheckCircleOutlineIcon fontSize="small" />
                    ) : (
                        <CancelOutlinedIcon fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>
        );
    };

    if (!pendingLoaded && Object.keys(pendingItemsMap).length === 0) {
        return (
            <Container maxWidth="lg">
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error && Object.keys(pendingItemsMap).length === 0) {
        return (
            <Container maxWidth="lg">
                <Box mt={4}>
                    <Typography color="error">{error}</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box mt={4} mb={2} display="flex" alignItems="center" gap={1}>
                <ErrorOutlineIcon color="warning" />
                <Typography variant="h4">Pending Items</Typography>
                <Chip label={`${pendingItems.length}`} color="warning" size="small" sx={{ ml: 1 }} />
                {!allItemsLoaded && (
                    <Tooltip title="Loading data for validation">
                        <Box display="flex" alignItems="center" gap={1} sx={{ color: 'text.secondary', ml: 2 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2">Preparing validation…</Typography>
                        </Box>
                    </Tooltip>
                )}
            </Box>

            {pendingItems.length === 0 ? (
                <Box py={6} textAlign="center">
                    <Typography variant="body1" color="text.secondary">No pending items found.</Typography>
                </Box>
            ) : (
                <List>
                    {pendingItems.map((item, index) => {
                        const color = getCategoryColor(item.Category, theme);
                        const isValid = allItemsLoaded ? hasValidMatch(item) : false;
                        return (
                            <React.Fragment key={item.id}>
                                <ListItem
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: alpha(color, 0.08) }
                                    }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: alpha(color, 0.2) }}>
                                            {getCategoryIcon(item.Category)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {item.DisplayName || item.Name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {format(new Date(item.Date), 'EEEE, MMM d')}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">•</Typography>
                                                <Typography variant="body2" color="text.secondary">{item.Category}</Typography>
                                                <Chip label="Pending" color="warning" size="small" />
                                            </Box>
                                        }
                                    />
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 'bold', color: theme.palette.text.primary, whiteSpace: 'nowrap' }}
                                        >
                                            {formatCurrency(item.Amount, item.Currency)}
                                        </Typography>
                                        {renderValidationIcon(item)}
                                        {isValid && (
                                            <Tooltip title="Delete pending item">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleDeletePending(item, e)}
                                                        disabled={deletingId === item.id}
                                                        sx={{ color: theme.palette.error.main }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </ListItem>
                                {index < pendingItems.length - 1 && (
                                    <Divider component="li" sx={{ borderStyle: 'dashed' }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </List>
            )}

            {/* Matches Dialog */}
            <Dialog open={matchesDialogOpen} onClose={closeMatchesDialog} fullWidth maxWidth="sm">
                <DialogTitle>
                    {matchDateKey ? `Items on ${matchDateKey}` : 'Items'}
                </DialogTitle>
                <DialogContent dividers>
                    {!allItemsLoaded ? (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress />
                        </Box>
                    ) : matchedItems.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No items found.</Typography>
                    ) : (
                        <List>
                            {matchedItems.map((m, idx) => {
                                const mColor = getCategoryColor(m.Category, theme);
                                return (
                                    <React.Fragment key={`${m.id}-${idx}`}>
                                        <ListItem onClick={() => handleItemClick(m)} sx={{ cursor: 'pointer' }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: alpha(mColor, 0.2) }}>
                                                    {getCategoryIcon(m.Category)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                        {m.DisplayName || m.Name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="body2" color="text.secondary">{m.Category}</Typography>
                                                        {m.PendingTransaction ? (
                                                            <Chip label="Pending" color="warning" size="small" />
                                                        ) : (
                                                            <Chip label="Cleared" color="success" size="small" />
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                {formatCurrency(m.Amount, m.Currency)}
                                            </Typography>
                                        </ListItem>
                                        {idx < matchedItems.length - 1 && (
                                            <Divider component="li" sx={{ borderStyle: 'dashed' }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeMatchesDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Details Dialog */}
            <ItemDetailsDialog
                open={detailsDialogOpen}
                item={selectedItem}
                onClose={handleCloseDetailsDialog}
                onEdit={handleEditClick}
            />

            {/* Edit Dialog */}
            <CardItemEditDialog
                open={editDialogOpen}
                cardItem={selectedItem}
                onClose={handleCloseEditDialog}
                onSave={handleSaveChanges}
            />
        </Container>
    );
};


