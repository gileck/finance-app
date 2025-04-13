import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress,
  Divider,
  Avatar,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem } from '@/client/utils/cardItemOperations';

interface RecentExpensesProps {
  items: CardItem[];
  loading: boolean;
  limit?: number;
}

// Function to format time relative to now
const formatRelativeTime = (dateString: string): string => {
  // Parse the date string (which is in UTC/ISO format)
  const date = new Date(dateString);
  
  // Get local date components
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  const localDay = date.getDate();
  const localMonth = date.getMonth();
  const localYear = date.getFullYear();
  
  // Format time as HH:MM
  const hours = localHours.toString().padStart(2, '0');
  const minutes = localMinutes.toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  
  // Get today's date components
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();
  
  // Calculate yesterday's date
  const yesterday = new Date(now);
  yesterday.setDate(todayDay - 1);
  const yesterdayDay = yesterday.getDate();
  const yesterdayMonth = yesterday.getMonth();
  const yesterdayYear = yesterday.getFullYear();
  
  // Check if the date is today or yesterday
  const isToday = localDay === todayDay && localMonth === todayMonth && localYear === todayYear;
  const isYesterday = localDay === yesterdayDay && localMonth === yesterdayMonth && localYear === yesterdayYear;
  
  if (isToday) {
    return `Today, ${timeString}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeString}`;
  } else {
    // Format date as DD/MM
    const day = localDay.toString().padStart(2, '0');
    const month = (localMonth + 1).toString().padStart(2, '0');
    return `${day}/${month}, ${timeString}`;
  }
};

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  items,
  loading,
  limit = 5
}) => {
  const theme = useTheme();
  
  // State for dialogs
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  
  // State for local items (to allow updates without reload)
  const [localItems, setLocalItems] = useState<CardItem[]>([]);
  
  // Initialize local items from props
  useEffect(() => {
    setLocalItems(items);
  }, [items]);
  
  // Filter items from the last 48 hours
  const getRecentItems = useCallback((): CardItem[] => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    return localItems
      .filter(item => new Date(item.Date) >= twoDaysAgo)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, limit);
  }, [localItems, limit]);
  
  const recentItems = getRecentItems();

  if (loading) {
    return (
      <DashboardCard 
        title="Recent Expenses (48h)" 
        icon={<AccessTimeIcon />}
        color="info"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <CircularProgress size={40} />
        </Box>
      </DashboardCard>
    );
  }

  if (recentItems.length === 0) {
    return (
      <DashboardCard 
        title="Recent Expenses (48h)" 
        icon={<AccessTimeIcon />}
        color="info"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <Typography variant="body1" color="text.secondary">
            No recent transactions
          </Typography>
        </Box>
      </DashboardCard>
    );
  }

  // Handle item click to open details dialog
  const handleItemClick = (item: CardItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };
  
  // Handle closing the details dialog
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

  return (
    <>
      <DashboardCard 
        title="Recent Expenses (48h)" 
        icon={<AccessTimeIcon />}
        color="info"
      >
        <List disablePadding sx={{ minHeight: 150 }}>
          {recentItems.map((item, index) => {
            const color = getCategoryColor(item.Category, theme);
            return (
              <React.Fragment key={item.id}>
                <ListItem 
                  disableGutters 
                  sx={{ 
                    py: 1.5,
                    px: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateX(4px)'
                    },
                    cursor: 'pointer' // Add cursor pointer to indicate clickable
                  }}
                  onClick={() => handleItemClick(item)} // Add click handler
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(color, 0.1), 
                      color: color,
                      mr: 2,
                      width: 36,
                      height: 36
                    }}
                  >
                    {getCategoryIcon(item.Category)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium',
                            fontSize: { xs: '0.875rem', sm: '0.95rem' },
                            mr: 1,
                            flexGrow: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.DisplayName || item.Name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={item.Category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: alpha(color, 0.1),
                            color: color,
                            maxWidth: 80,
                            '& .MuiChip-label': {
                              px: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                          }}
                        />
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {formatRelativeTime(item.Date)}
                        </Typography>
                      </Box>
                    }
                    sx={{ my: 0 }}
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
                {index < recentItems.length - 1 && (
                  <Divider component="li" sx={{ borderStyle: 'dashed' }} />
                )}
              </React.Fragment>
            );
          })}
        </List>
      </DashboardCard>
      
      {/* Item Details Dialog */}
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
