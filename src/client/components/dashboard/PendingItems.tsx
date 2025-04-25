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
    useTheme,
    alpha
} from '@mui/material';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem } from '@/client/utils/cardItemOperations';

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
                                </ListItem>
                                {index < pendingItems.length - 1 && (
                                    <Divider component="li" sx={{ borderStyle: 'dashed' }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </List>
            </DashboardCard>

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