import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { CardItem } from '@/apis/cardItems/types';

interface CardItemsListProps {
  cardItems: Record<string, CardItem>;
  onEdit: (item: CardItem) => void;
  onDelete: (id: string) => void;
  setMonthRef?: (monthKey: string, element: HTMLDivElement | null) => void;
}

// Helper to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Helper to format currency
const formatCurrency = (amount: number, currency: string): string => {
  // For NIS currency, use the ₪ symbol
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
  onEdit, 
  onDelete,
  setMonthRef 
}) => {
  const groupedItems = groupByMonth(cardItems);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Toggle month expansion
  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  // Handle delete click
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  // Cancel delete
  const cancelDelete = () => {
    setItemToDelete(null);
    setDeleteDialogOpen(false);
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
              ref={element => setMonthRef && setMonthRef(monthKey, element)}
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
                  {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {item.DisplayName || item.Name}
                            </Typography>
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
                                <Chip 
                                  label={item.Category} 
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
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
                                aria-label="edit"
                                onClick={() => onEdit(item)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => handleDeleteClick(item.id)}
                                size="small"
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          );
        })}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this item?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
