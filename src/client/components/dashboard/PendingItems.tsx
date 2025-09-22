import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    CircularProgress,
    Divider,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    useTheme,
    alpha
} from '@mui/material';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem, deleteCardItem } from '@/client/utils/cardItemOperations';

interface PendingItemsProps {
    items: CardItem[];
    loading: boolean;
    limit?: number;
}

export const PendingItems: React.FC<PendingItemsProps> = ({
    items,
    loading,
    limit = 5
}) => {
    const theme = useTheme();
    const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [localItems, setLocalItems] = useState<CardItem[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [matchesDialogOpen, setMatchesDialogOpen] = useState<boolean>(false);
    const [matchedItems, setMatchedItems] = useState<CardItem[]>([]);
    const [matchCriteria, setMatchCriteria] = useState<{ dateKey: string } | null>(null);

    // Initialize local items from props
    useEffect(() => {
        setLocalItems(items);
    }, [items]);

    const getPendingItems = (): CardItem[] => {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

        return localItems
            .filter(item => item.PendingTransaction && new Date(item.Date) < twoDaysAgo)
            .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())
            .slice(0, limit);
    };

    const pendingItems = getPendingItems();

    const getDateKey = (dateStr: string): string => {
        const d = new Date(dateStr);
        return d.toDateString();
    };

    const getNormalizedName = (item: CardItem): string => {
        const name = (item.DisplayName || item.Name || '').trim().toLowerCase();
        return name;
    };

    const hasValidMatch = (pendingItem: CardItem): boolean => {
        const pendingDateKey = getDateKey(pendingItem.Date);
        const pendingName = getNormalizedName(pendingItem);
        const pendingAmount = pendingItem.Amount;
        const pendingCurrency = pendingItem.Currency;

        return localItems.some(other => {
            if (other.id === pendingItem.id) return false;
            if (other.PendingTransaction) return false;
            if (other.Currency !== pendingCurrency) return false;
            const sameDate = getDateKey(other.Date) === pendingDateKey;
            const sameName = getNormalizedName(other) === pendingName;
            if (pendingAmount === 0) {
                // Special rule: amount 0 should match only by same day and name (ignore amount)
                return sameDate && sameName;
            }
            const sameAmount = other.Amount === pendingAmount;
            return sameAmount && sameDate && sameName;
        });
    };

    const handleDeletePending = async (item: CardItem, e: React.MouseEvent): Promise<void> => {
        e.stopPropagation();
        if (deletingId) return;
        setDeletingId(item.id);
        try {
            const result = await deleteCardItem(item.id);
            if (result.success) {
                setLocalItems(prev => prev.filter(i => i.id !== item.id));
            } else {
                console.error('Failed to delete card item:', result.message);
            }
        } catch (err) {
            console.error('Error deleting card item:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const getSameDayItems = (item: CardItem): CardItem[] => {
        const dateKey = getDateKey(item.Date);
        return localItems.filter(other => getDateKey(other.Date) === dateKey);
    };

    const handleOpenMatches = (item: CardItem, e: React.MouseEvent): void => {
        e.stopPropagation();
        const items = getSameDayItems(item);
        setMatchedItems(items);
        setMatchCriteria({ dateKey: getDateKey(item.Date) });
        setMatchesDialogOpen(true);
    };

    const handleCloseMatches = (): void => {
        setMatchesDialogOpen(false);
        setMatchedItems([]);
        setMatchCriteria(null);
    };

    const handleItemClick = (item: CardItem) => {
        setSelectedItem(item);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetailsDialog = () => {
        setDetailsDialogOpen(false);
        setSelectedItem(null);
    };

    // Handle edit button click from details dialog
    const handleEditClick = (item: CardItem) => {
        setDetailsDialogOpen(false);
        setSelectedItem(item);
        setEditDialogOpen(true);
    };

    // Handle closing the edit dialog
    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedItem(null);
    };

    // Handle saving changes from edit dialog
    const handleSaveChanges = async (updatedItem: CardItem): Promise<void> => {
        try {
            const result = await updateCardItem(updatedItem);

            if (result.success && result.updatedItem) {
                // Update local state instead of reloading the page
                setLocalItems(prevItems => {
                    return prevItems.map(item =>
                        item.id === updatedItem.id ? updatedItem : item
                    );
                });
            }
        } catch (error) {
            console.error('Error updating card item:', error);
        } finally {
            setEditDialogOpen(false);
            setSelectedItem(null);
        }
    };

    if (loading) {
        return (
            <DashboardCard
                title="Pending Items (>48h)"
                icon={<ErrorOutlineIcon />}
                color="warning"
            >
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
                    <CircularProgress size={40} />
                </Box>
            </DashboardCard>
        );
    }

    if (pendingItems.length === 0) {
        return (
            <DashboardCard
                title="Pending Items (>48h)"
                icon={<ErrorOutlineIcon />}
                color="warning"
            >
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
                    <Typography variant="body1" color="text.secondary">
                        No pending items
                    </Typography>
                </Box>
            </DashboardCard>
        );
    }

    return (
        <>
            <DashboardCard
                title="Pending Items (>48h)"
                icon={<ErrorOutlineIcon />}
                color="warning"
            >
                <List>
                    {pendingItems.map((item, index) => {
                        const color = getCategoryColor(item.Category, theme);
                        const isValid = hasValidMatch(item);

                        return (
                            <React.Fragment key={item.id}>
                                <ListItem
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: alpha(color, 0.1),
                                        }
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
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 'medium',
                                                    color: theme.palette.text.primary
                                                }}
                                            >
                                                {item.DisplayName || item.Name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                {item.Category}
                                                <Chip
                                                    label="Pending"
                                                    color="warning"
                                                    size="small"
                                                />
                                            </Typography>
                                        }
                                    />
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: theme.palette.text.primary,
                                                whiteSpace: 'nowrap',
                                                fontSize: { xs: '0.875rem', sm: '0.95rem' }
                                            }}
                                        >
                                            {formatCurrency(item.Amount, item.Currency)}
                                        </Typography>
                                        <Tooltip title={isValid ? 'Valid match found' : 'No matching cleared item'}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleOpenMatches(item, e)}
                                                sx={{ color: isValid ? theme.palette.success.main : theme.palette.error.main }}
                                            >
                                                {isValid ? (
                                                    <CheckCircleOutlineIcon fontSize="small" />
                                                ) : (
                                                    <CancelOutlinedIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
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
            </DashboardCard>

            <Dialog open={matchesDialogOpen} onClose={handleCloseMatches} fullWidth maxWidth="sm">
                <DialogTitle>
                    {matchCriteria ? (
                        `Items on ${matchCriteria.dateKey}`
                    ) : 'Matching Items'}
                </DialogTitle>
                <DialogContent dividers>
                    {matchedItems.length === 0 ? (
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
                                                        <Typography variant="body2" color="text.secondary">
                                                            {m.Category}
                                                        </Typography>
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
                    <Button onClick={handleCloseMatches}>Close</Button>
                </DialogActions>
            </Dialog>

            <ItemDetailsDialog
                open={detailsDialogOpen}
                item={selectedItem}
                onClose={handleCloseDetailsDialog}
                onEdit={handleEditClick}
            />

            {/* Card Item Edit Dialog */}
            <CardItemEditDialog
                open={editDialogOpen}
                cardItem={selectedItem}
                onClose={handleCloseEditDialog}
                onSave={handleSaveChanges}
            />
        </>
    );
}; 