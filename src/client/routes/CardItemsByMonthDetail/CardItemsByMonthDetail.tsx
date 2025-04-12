import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { getCardItems } from '@/apis/cardItems/client';
import { CardItem } from '@/apis/cardItems/types';
import { CardItemsList } from '../CardItems/CardItemsList';
import { CategoryBreakdown } from './CategoryBreakdown';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem, deleteCardItem } from '@/client/utils/cardItemOperations';
import { useRouter } from '@/client/router';
import { ArrowBackIos } from '@mui/icons-material';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`month-detail-tabpanel-${index}`}
      aria-labelledby={`month-detail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const CardItemsByMonthDetail = () => {
  const router = useRouter();
  const { year, month } = router.routeParams;
  const [cardItems, setCardItems] = useState<Record<string, CardItem>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editItem, setEditItem] = useState<CardItem | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format month name for display
  const getMonthName = useCallback(() => {
    if (!month || !year) return '';
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  }, [month, year]);

  // Fetch card items for the specific month
  const fetchCardItems = useCallback(async () => {
    if (!month || !year) {
      setError('Invalid month or year parameters');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Create date range for the specific month
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      const response = await getCardItems({
        filter: {
          startDate,
          endDate
        }
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setCardItems(response.data.cardItems);
      }
    } catch (err) {
      setError(`Failed to fetch card items: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  // Initial load
  useEffect(() => {
    fetchCardItems();
  }, [fetchCardItems]);

  // Handle edit click
  const handleEditClick = (item: CardItem) => {
    setEditItem({ ...item });
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
  };

  // Handle save changes
  const handleSaveChanges = async (updatedItem: CardItem): Promise<void> => {
    const result = await updateCardItem(updatedItem);
    
    setSnackbar({
      open: true,
      message: result.message,
      severity: result.severity
    });
    
    if (result.success && result.updatedItem) {
      // Update local state
      setCardItems(prevItems => ({
        ...prevItems,
        [updatedItem.id]: updatedItem
      }));
      
      handleCloseDialog();
    }
  };

  // Handle delete click
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      const result = await deleteCardItem(itemToDelete);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.severity
      });
      
      if (result.success) {
        // Update local state
        const newCardItems = { ...cardItems };
        delete newCardItems[itemToDelete];
        setCardItems(newCardItems);
      }
      
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Navigate back to monthly totals
  const handleBackClick = () => {
    router.navigate('/card-items-by-month');
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="error">{error}</Alert>
          <Box mt={2}>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />}
              onClick={handleBackClick}
            >
              Back to Monthly Totals
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  // Check if we have items to display
  const hasItems = Object.keys(cardItems).length > 0;

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <Button 
            variant="text" 
            startIcon={<ArrowBackIos />}
            onClick={handleBackClick}
            sx={{ mr: 2 }}
          />
          <Typography variant="h4" component="h1">
            {getMonthName()}
          </Typography>
        </Box>
      </Box>

      {hasItems ? (
        <>
          <Paper sx={{ mb: 4 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              aria-label="month detail tabs"
            >
              <Tab 
                icon={<CategoryIcon />} 
                label="By Category" 
                id="month-detail-tab-0"
                aria-controls="month-detail-tabpanel-0" 
              />
              <Tab 
                icon={<ListAltIcon />} 
                label="All Transactions" 
                id="month-detail-tab-1"
                aria-controls="month-detail-tabpanel-1" 
              />
            </Tabs>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            <CategoryBreakdown cardItems={cardItems} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CardItemsList 
              cardItems={cardItems} 
              onEditClick={handleEditClick} 
              onDeleteClick={handleDeleteClick}
            />
          </TabPanel>
        </>
      ) : (
        <Alert severity="info">No transactions found for this month.</Alert>
      )}

      {/* Edit Dialog */}
      <CardItemEditDialog
        open={openDialog}
        cardItem={editItem}
        onClose={handleCloseDialog}
        onSave={handleSaveChanges}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
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
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
