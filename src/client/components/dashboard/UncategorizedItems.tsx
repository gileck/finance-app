import React, { useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    useTheme,
    alpha,
    LinearProgress,
    Divider,
    Checkbox,
    ListItemIcon,
    Button,
    Chip,
    Stack
} from '@mui/material';
import {
    Category as CategoryIcon,
    SelectAll as SelectAllIcon,
    ClearAll as ClearAllIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import { formatCurrency } from '@/client/utils/categoryUtils';
import { CategorySelectionDialog } from '@/client/components/shared/CategorySelectionDialog';
import { updateCardItem } from '@/client/utils/cardItemOperations';

interface UncategorizedItemsProps {
    items: CardItem[];
    loading: boolean;
    limit?: number;
    onItemUpdate?: (updatedItem: CardItem) => void;
    onBatchItemUpdate?: (updatedItems: CardItem[]) => void;
}

export const UncategorizedItems: React.FC<UncategorizedItemsProps> = ({
    items,
    loading,
    limit = 10,
    onItemUpdate,
    onBatchItemUpdate
}) => {
    const theme = useTheme();

    // State for category selection dialog
    const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
    const [itemsForCategory, setItemsForCategory] = useState<CardItem[]>([]);

    // State for tracking item updates in progress
    const [updatingItemIds, setUpdatingItemIds] = useState<Set<string>>(new Set());

    // State for multi-select functionality
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);

    // Filter items that don't have a category
    const uncategorizedItems = items.filter(item =>
        !item.Category || item.Category.trim() === '' || item.Category === 'Uncategorized'
    ).slice(0, limit);

    // Helper function to notify parent of updates
    const notifyParentOfUpdates = (updatedItems: CardItem[]) => {
        if (onBatchItemUpdate) {
            onBatchItemUpdate(updatedItems);
        } else if (onItemUpdate) {
            // Fallback to individual updates with timing
            updatedItems.forEach((updatedItem, index) => {
                setTimeout(() => {
                    onItemUpdate(updatedItem);
                }, index * 10);
            });
        }
    };

    // Toggle multi-select mode
    const toggleMultiSelectMode = () => {
        setMultiSelectMode(!multiSelectMode);
        // Clear selections when exiting multi-select mode
        if (multiSelectMode) {
            setSelectedItems(new Set());
        }
    };

    // Handle item selection toggle
    const handleItemToggle = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    // Handle select all
    const handleSelectAll = () => {
        const allIds = new Set(uncategorizedItems.map(item => item.id));
        setSelectedItems(allIds);
    };

    // Handle clear all
    const handleClearAll = () => {
        setSelectedItems(new Set());
    };

    // Handle item click
    const handleItemClick = (item: CardItem) => {
        if (multiSelectMode && selectedItems.size > 0) {
            // In multi-select mode with selections, categorize all selected items
            const selectedItemsArray = uncategorizedItems.filter(selectedItem =>
                selectedItems.has(selectedItem.id)
            );
            setItemsForCategory(selectedItemsArray);
        } else {
            // Single item mode or no selections
            setItemsForCategory([item]);
        }
        setCategoryDialogOpen(true);
    };

    // Handle category selection
    const handleCategorySelect = async (category: string) => {
        if (itemsForCategory.length > 0) {
            try {
                // Set updating state for all items being updated
                const updatingIds = new Set(itemsForCategory.map(item => item.id));
                setUpdatingItemIds(updatingIds);
                setCategoryDialogOpen(false);

                // Update all items with the new category sequentially to avoid race conditions
                const updatedItems: CardItem[] = [];

                for (const item of itemsForCategory) {
                    const updatedItem = { ...item, Category: category };
                    const result = await updateCardItem(updatedItem);

                    if (result.success) {
                        updatedItems.push(updatedItem);
                    } else {
                        console.error('Failed to update category for item:', item.id, result.message);
                    }
                }

                // Notify parent component for all successfully updated items
                if (updatedItems.length > 0) {
                    notifyParentOfUpdates(updatedItems);
                }

                // Clear selected items after successful update if in multi-select mode
                if (multiSelectMode) {
                    setSelectedItems(new Set());
                }
            } catch (error) {
                console.error('Error updating categories:', error);
            } finally {
                // Clear updating state
                setUpdatingItemIds(new Set());
                setItemsForCategory([]);
            }
        }
    };

    // Handle close category dialog
    const handleCloseCategoryDialog = () => {
        setCategoryDialogOpen(false);
        setItemsForCategory([]);
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <DashboardCard
                title="Uncategorized Items"
                icon={<CategoryIcon />}
                color="warning"
            >
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
                    <CircularProgress size={40} />
                </Box>
            </DashboardCard>
        );
    }

    if (uncategorizedItems.length === 0) {
        return (
            <DashboardCard
                title="Uncategorized Items"
                icon={<CategoryIcon />}
                color="success"
            >
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
                    <Typography variant="body1" color="text.secondary">
                        All items are categorized! 🎉
                    </Typography>
                </Box>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard
            title="Uncategorized Items"
            icon={<CategoryIcon />}
            color="warning"
        >
            {/* Mode Toggle and Selection Controls */}
            <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: multiSelectMode ? 1 : 0 }}>
                    <Button
                        size="small"
                        variant={multiSelectMode ? "contained" : "outlined"}
                        startIcon={<CheckBoxOutlineBlankIcon />}
                        onClick={toggleMultiSelectMode}
                        sx={{ fontSize: '0.75rem' }}
                    >
                        {multiSelectMode ? 'Exit Multi-Select' : 'Select Multi'}
                    </Button>
                </Stack>

                {/* Multi-select controls - only show when in multi-select mode */}
                {multiSelectMode && (
                    <>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SelectAllIcon />}
                                onClick={handleSelectAll}
                                disabled={selectedItems.size === uncategorizedItems.length}
                                sx={{ fontSize: '0.75rem' }}
                            >
                                Select All
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ClearAllIcon />}
                                onClick={handleClearAll}
                                disabled={selectedItems.size === 0}
                                sx={{ fontSize: '0.75rem' }}
                            >
                                Clear
                            </Button>
                            {selectedItems.size > 0 && (
                                <Chip
                                    label={`${selectedItems.size} selected`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                        </Stack>

                        {/* Info message when items are selected */}
                        {selectedItems.size > 0 && (
                            <Box sx={{
                                mt: 1,
                                p: 1,
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                borderRadius: 1,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                            }}>
                                <Typography variant="caption" color="info.main">
                                    💡 Click any item to categorize all {selectedItems.size} selected items
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            <List disablePadding sx={{ minHeight: 150 }}>
                {uncategorizedItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <ListItem
                            sx={{
                                position: 'relative',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: multiSelectMode && selectedItems.size > 0 ?
                                        alpha(theme.palette.primary.main, 0.15) :
                                        alpha(theme.palette.warning.main, 0.1),
                                },
                                borderRadius: 1,
                                mb: 0.5,
                                backgroundColor: selectedItems.has(item.id) ?
                                    alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                // Add visual indication when in multi-select mode with selections
                                ...(multiSelectMode && selectedItems.size > 0 && {
                                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                        borderColor: theme.palette.primary.main,
                                    }
                                })
                            }}
                        >
                            {/* Loading indicator for category update */}
                            {updatingItemIds.has(item.id) && (
                                <LinearProgress
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: 2,
                                        borderRadius: '4px 4px 0 0'
                                    }}
                                />
                            )}

                            {/* Only show checkbox in multi-select mode */}
                            {multiSelectMode && (
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Checkbox
                                        checked={selectedItems.has(item.id)}
                                        onChange={() => handleItemToggle(item.id)}
                                        disabled={updatingItemIds.has(item.id)}
                                        color="primary"
                                    />
                                </ListItemIcon>
                            )}

                            <ListItemText
                                onClick={() => handleItemClick(item)}
                                sx={{ cursor: 'pointer' }}
                                primary={
                                    <Typography variant="body1" fontWeight="medium" noWrap>
                                        {item.DisplayName || item.Name}
                                    </Typography>
                                }
                                secondary={
                                    <Box mt={0.5}>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(item.Date)}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                                            <Typography variant="body2" color="text.secondary">
                                                {multiSelectMode && selectedItems.size > 0
                                                    ? `Click to categorize ${selectedItems.size} selected items`
                                                    : "Click to categorize"
                                                }
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                fontWeight="bold"
                                                color="text.primary"
                                            >
                                                {formatCurrency(item.Amount, item.Currency)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < uncategorizedItems.length - 1 && (
                            <Divider component="li" sx={{ borderStyle: 'dashed' }} />
                        )}
                    </React.Fragment>
                ))}
            </List>

            {/* Category Selection Dialog */}
            <CategorySelectionDialog
                open={categoryDialogOpen}
                onClose={handleCloseCategoryDialog}
                onSelectCategory={handleCategorySelect}
            />
        </DashboardCard>
    );
}; 