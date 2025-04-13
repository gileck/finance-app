import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  Chip,
  alpha,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { getCardItems } from '@/apis/cardItems/client';

interface RecurringTransactionsProps {
  limit?: number;
}

export const RecurringTransactions: React.FC<RecurringTransactionsProps> = ({
  limit = 5
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recurringItems, setRecurringItems] = useState<CardItem[]>([]);
  const [allRecurringItems, setAllRecurringItems] = useState<CardItem[]>([]);
  
  // State for history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [historyItems, setHistoryItems] = useState<CardItem[]>([]);
  
  // Fetch recurring transactions from the last 3 months
  useEffect(() => {
    const fetchRecurringTransactions = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JavaScript months are 0-indexed
        
        // Create date range for the last 3 months
        const startDate = new Date(year, month - 3, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        const response = await getCardItems({
          filter: {
            startDate,
            endDate
          }
        });

        if (response.data.error) {
          setError(response.data.error);
        } else {
          // Filter for recurring transactions
          const allItems = Object.values(response.data.cardItems);
          const recurring = allItems.filter(item => item.IsRecurringTransaction);

          console.log('recurring', recurring);
          
          // Store all recurring items for history lookup
          setAllRecurringItems(recurring);
          
          // Remove duplicates based on Name (or DisplayName if available)
          const uniqueRecurring = removeDuplicateTransactions(recurring);
          
          // Sort by amount (highest first)
          uniqueRecurring.sort((a, b) => b.Amount - a.Amount);
          
          // Limit the number of items
          setRecurringItems(uniqueRecurring.slice(0, 20));
        }
      } catch (err) {
        setError(`Failed to fetch recurring transactions: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecurringTransactions();
  }, [limit]);
  
  // Helper function to remove duplicate transactions
  const removeDuplicateTransactions = (items: CardItem[]): CardItem[] => {
    const uniqueMap = new Map<string, CardItem>();
    
    items.forEach(item => {
      const key = item.DisplayName || item.Name;
      
      // If this name doesn't exist in the map yet, or if this transaction has a higher amount
      if (!uniqueMap.has(key) || uniqueMap.get(key)!.Amount < item.Amount) {
        uniqueMap.set(key, item);
      }
    });
    
    return Array.from(uniqueMap.values());
  };
  
  // Handle item click to show history
  const handleItemClick = (item: CardItem) => {
    const itemName = item.DisplayName || item.Name;
    setSelectedItemName(itemName);
    
    // Find all matching transactions
    const matchingItems = allRecurringItems.filter(
      i => (i.DisplayName || i.Name) === itemName
    );
    
    // Sort by date (newest first)
    matchingItems.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    
    setHistoryItems(matchingItems);
    setHistoryDialogOpen(true);
  };
  
  // Format date for display in the history dialog
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Render loading state
  if (loading) {
    return (
      <DashboardCard title="Recurring Transactions" icon={<RepeatIcon />} color="secondary">
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress size={40} color="secondary" />
        </Box>
      </DashboardCard>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <DashboardCard title="Recurring Transactions" icon={<RepeatIcon />} color="secondary">
        <Box p={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  // Render empty state
  if (recurringItems.length === 0) {
    return (
      <DashboardCard title="Recurring Transactions" icon={<RepeatIcon />} color="secondary">
        <Box p={2} textAlign="center">
          <Typography color="textSecondary">No recurring transactions found</Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  return (
    <>
      <DashboardCard title="Recurring Transactions" icon={<RepeatIcon />} color="secondary">
        <List disablePadding>
          {recurringItems.map((item, index) => {
            const color = getCategoryColor(item.Category, theme);
            
            return (
              <React.Fragment key={item.id}>
                <ListItem 
                  alignItems="flex-start" 
                  button 
                  onClick={() => handleItemClick(item)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: alpha(color, 0.1),
                        color: color
                      }}
                    >
                      {getCategoryIcon(item.Category)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        {item.DisplayName || item.Name}
                      </Typography>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Chip
                          label={item.Category}
                          size="small"
                          sx={{
                            height: 24,
                            backgroundColor: alpha(color, 0.1),
                            color: color
                          }}
                        />
                      </Box>
                    }
                  />
                  <Box textAlign="right">
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(item.Amount, item.Currency)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Monthly
                    </Typography>
                  </Box>
                </ListItem>
                {index < recurringItems.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      </DashboardCard>
      
      {/* Transaction History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Transaction History: {selectedItemName}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Showing {historyItems.length} occurrences
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {historyItems.length === 0 ? (
            <Box p={2} textAlign="center">
              <Typography color="textSecondary">No history found</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Category</TableCell>
                    {historyItems[0].CardId && <TableCell>Card</TableCell>}
                    {historyItems.some(item => item.Comments && item.Comments.length > 0) && (
                      <TableCell>Comments</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyItems.map(item => {
                    const color = getCategoryColor(item.Category, theme);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.Date)}</TableCell>
                        <TableCell>{formatCurrency(item.Amount, item.Currency)}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.Category}
                            size="small"
                            sx={{
                              height: 24,
                              backgroundColor: alpha(color, 0.1),
                              color: color
                            }}
                          />
                        </TableCell>
                        {historyItems[0].CardId && (
                          <TableCell>
                            {item.CardId} {item.CardType ? `(${item.CardType})` : ''}
                          </TableCell>
                        )}
                        {historyItems.some(item => item.Comments && item.Comments.length > 0) && (
                          <TableCell>
                            {item.Comments && item.Comments.length > 0
                              ? item.Comments.join(', ')
                              : '-'}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
