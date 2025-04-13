import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  Link,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ErrorOutline as ErrorOutlineIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { CardItem } from '@/apis/cardItems/types';
import { ItemDetailsDialog } from '@/client/components/dashboard/ItemDetailsDialog';
import { CategorySelectionDialog } from '@/client/components/shared/CategorySelectionDialog';
import { updateCardItem } from '@/client/utils/cardItemOperations';

interface CardItemsListProps {
  cardItems: Record<string, CardItem>;
  onEditClick: (item: CardItem) => void;
  onDeleteClick: (id: string) => void;
  monthRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onItemUpdate?: (updatedItem: CardItem) => void;
}

// Helper to format date for divider (without year)
const formatDateForDivider = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Get the day name
  const dayName = new Intl.DateTimeFormat('en-US', {
    weekday: 'long' // 'long' for full day name (e.g., "Monday")
  }).format(date);
  
  // Get the month and day
  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
  
  // Combine day name with month and day
  return `${dayName}, ${monthDay}`;
};

// Helper to get date key (YYYY-MM-DD) for grouping
const getDateKey = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper to format time only
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format the month and day
  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric'
  }).format(date);
  
  // Format the time in 24-hour format (HH:MM)
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;
  
  // Combine in the format "April 13, 14:24"
  return `${monthDay}, ${time}`;
};

// Helper to format currency
const formatCurrency = (amount: number, currency: string): string => {
  // For NIS currency, use the symbol
  if (currency === 'NIS') {
    return `₪${amount.toFixed(2)}`;
  }
  
  // For other currencies, use the Intl formatter
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

// Helper to group card items by month
const groupByMonth = (items: Record<string, CardItem>): Record<string, CardItem[]> => {
  const grouped: Record<string, CardItem[]> = {};
  
  Object.values(items).forEach(item => {
    const date = new Date(item.Date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    
    grouped[monthYear].push(item);
  });
  
  // Sort items within each month by date (newest first)
  Object.keys(grouped).forEach(month => {
    grouped[month].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
  });
  
  return grouped;
};

// Helper to calculate month total
const calculateMonthTotal = (items: CardItem[]): { amount: number; currency: string } => {
  // Group by currency first
  const totals: Record<string, number> = {};
  
  items.forEach(item => {
    if (!totals[item.Currency]) {
      totals[item.Currency] = 0;
    }
    totals[item.Currency] += item.Amount;
  });
  
  // For simplicity, return the first currency's total (most items will be same currency)
  // In a real app, you might want to handle multiple currencies differently
  const currencies = Object.keys(totals);
  return {
    amount: totals[currencies[0]] || 0,
    currency: currencies[0] || 'NIS'
  };
};

export const CardItemsList: React.FC<CardItemsListProps> = ({ 
  cardItems, 
  onEditClick, 
  onDeleteClick,
  monthRefs,
  onItemUpdate
}) => {
  const [localCardItems, setLocalCardItems] = useState<Record<string, CardItem>>(cardItems);
  
  useEffect(() => {
    setLocalCardItems(cardItems);
  }, [cardItems]);
  
  const groupedItems = groupByMonth(localCardItems);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  
  // State for details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
  
  // State for category selection dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
  const [itemForCategory, setItemForCategory] = useState<CardItem | null>(null);
  
  // State for tracking item updates in progress
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  
  // State for tracking item deletes in progress
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Toggle month expansion
  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  // Handle delete click
  const handleDeleteClick = async (id: string) => {
    // Set deleting state to show loading indicator
    setDeletingItemId(id);
    
    // Call the parent's onDeleteClick handler
    await onDeleteClick(id);
    
    // Clear deleting state after a short delay to ensure the animation is visible
    setTimeout(() => {
      setDeletingItemId(null);
    }, 300);
  };
  
  // Handle view details click
  const handleViewDetails = (item: CardItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };
  
  // Handle close details dialog
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedItem(null);
  };
  
  // Handle edit from details dialog
  const handleEditFromDetails = (item: CardItem) => {
    setDetailsDialogOpen(false);
    setSelectedItem(null);
    onEditClick(item);
  };

  // Handle add category click
  const handleAddCategoryClick = (item: CardItem) => {
    setItemForCategory(item);
    setCategoryDialogOpen(true);
  };
  
  // Handle category selection
  const handleCategorySelect = async (category: string) => {
    if (itemForCategory) {
      const updatedItem = { ...itemForCategory, Category: category };
      
      try {
        // Set updating state to show loading indicator
        setUpdatingItemId(itemForCategory.id);
        setCategoryDialogOpen(false);
        
        // Update the item with the new category
        const result = await updateCardItem(updatedItem);
        
        if (result.success) {
          // Update local state
          setLocalCardItems(prev => ({
            ...prev,
            [updatedItem.id]: updatedItem
          }));
          
          // Notify parent component if callback exists
          if (onItemUpdate) {
            onItemUpdate(updatedItem);
          }
        } else {
          console.error('Failed to update category:', result.message);
        }
      } catch (error) {
        console.error('Error updating category:', error);
      } finally {
        // Clear updating state
        setUpdatingItemId(null);
        setItemForCategory(null);
      }
    }
  };
  
  // Handle close category dialog
  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setItemForCategory(null);
  };

  // Get month name from key
  const getMonthName = (monthKey: string, items: CardItem[]): string => {
    if (items.length === 0) return monthKey;
    const date = new Date(items[0].Date);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <>
      {Object.keys(groupedItems)
        .sort((a, b) => b.localeCompare(a)) // Sort months in descending order
        .map(monthKey => {
          const items = groupedItems[monthKey];
          const isExpanded = expandedMonths[monthKey] !== false; // Default to expanded
          const monthName = getMonthName(monthKey, items);
          const monthTotal = calculateMonthTotal(items);
          
          return (
            <Paper 
              key={monthKey} 
              elevation={2} 
              sx={{ mb: 3, overflow: 'hidden' }}
              ref={element => {
                if (monthRefs && element) {
                  monthRefs.current[monthKey] = element;
                }
              }}
            >
              <Box 
                p={2} 
                bgcolor="primary.main" 
                color="primary.contrastText"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                onClick={() => toggleMonthExpansion(monthKey)}
                sx={{ cursor: 'pointer' }}
              >
                <Box display="flex" alignItems="center">
                  <IconButton 
                    color="inherit" 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMonthExpansion(monthKey);
                    }}
                    sx={{ mr: 2 }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  <Typography variant="h6">{monthName}</Typography>
                </Box>
                <Typography variant="h6">
                  {formatCurrency(monthTotal.amount, monthTotal.currency)}
                </Typography>
              </Box>
              
              {isExpanded && (
                <List>
                  {items.map((item, index) => {
                    // Group by date
                    const dateKey = getDateKey(item.Date);
                    const showDateDivider = index === 0 || dateKey !== getDateKey(items[index - 1].Date);
                    
                    return (
                      <React.Fragment key={item.id}>
                        {/* Date divider */}
                        {showDateDivider && (
                          <Box 
                            sx={{ 
                              py: 1, 
                              px: 2, 
                              backgroundColor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Typography variant="subtitle2" color="text.secondary">
                              {formatDateForDivider(item.Date)}
                            </Typography>
                          </Box>
                        )}
                        
                        <ListItem>
                          {/* Loading indicator for category update */}
                          {updatingItemId === item.id && (
                            <LinearProgress 
                              sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0,
                                height: 2
                              }} 
                            />
                          )}
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography variant="body1" fontWeight="medium">
                                  {item.DisplayName || item.Name}
                                </Typography>
                                {item.PendingTransaction && (
                                  <Tooltip title="Pending Transaction" arrow>
                                    <ErrorOutlineIcon 
                                      color="warning" 
                                      fontSize="small" 
                                      sx={{ ml: 1 }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box mt={0.5}>
                                <Typography variant="body2" color="text.secondary">
                                {formatDate(item.Date)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.Comments && `${item.Comments}`}
                                </Typography>
                                <Box mt={0.5}>
                                  {item.Category ? (
                                    <Chip 
                                      label={item.Category} 
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ) : (
                                    <Link
                                      component="button"
                                      variant="body2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddCategoryClick(item);
                                      }}
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        color: 'primary.main',
                                        textDecoration: 'none',
                                        '&:hover': {
                                          textDecoration: 'underline'
                                        }
                                      }}
                                    >
                                      <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                                      Add category
                                    </Link>
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box display="flex" flexDirection="column" alignItems="flex-end">
                              <Typography variant="body1" fontWeight="medium">
                                {formatCurrency(item.Amount, item.Currency)}
                              </Typography>
                              <Box mt={1}>
                                <IconButton 
                                  edge="end" 
                                  aria-label="view details"
                                  onClick={() => handleViewDetails(item)}
                                  size="small"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label="edit"
                                  onClick={() => onEditClick(item)}
                                  size="small"
                                  sx={{ ml: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  onClick={() => handleDeleteClick(item.id)}
                                  size="small"
                                  sx={{ ml: 1 }}
                                  disabled={deletingItemId === item.id}
                                >
                                  {deletingItemId === item.id ? (
                                    <CircularProgress size={18} />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Box>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < items.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Paper>
          );
        })}

      {/* Item Details Dialog */}
      <ItemDetailsDialog
        open={detailsDialogOpen}
        item={selectedItem}
        onClose={handleCloseDetailsDialog}
        onEdit={handleEditFromDetails}
      />
      
      {/* Category Selection Dialog */}
      <CategorySelectionDialog
        open={categoryDialogOpen}
        onClose={handleCloseCategoryDialog}
        onSelectCategory={handleCategorySelect}
      />
    </>
  );
};
