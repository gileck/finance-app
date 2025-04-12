import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  getCardItems
} from '@/apis/cardItems/client';
import { CardItem } from '@/apis/cardItems/types';
import { CardItemsList } from './CardItemsList';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem, deleteCardItem } from '@/client/utils/cardItemOperations';

// Number of months to load initially
const INITIAL_MONTHS = 2;
// Number of months to load on each scroll
const MONTHS_PER_SCROLL = 1;

export const CardItems = () => {
  const [cardItems, setCardItems] = useState<Record<string, CardItem>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<CardItem | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // References for infinite scrolling
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch card items with pagination
  const fetchCardItems = useCallback(async (currentOffset: number, limit: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getCardItems({
        filter: selectedCategory ? { category: selectedCategory } : undefined,
        pagination: {
          limit,
          offset: currentOffset
        }
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        if (append) {
          // Append new items to existing ones
          setCardItems(prevItems => ({
            ...prevItems,
            ...response.data.cardItems
          }));
        } else {
          // Replace existing items
          setCardItems(response.data.cardItems);
        }
        
        setHasMore(response.data.hasMore);
        
        // Extract unique categories from the items
        if (!append) {
          const uniqueCategories = Array.from(
            new Set(Object.values(response.data.cardItems).map(item => item.Category))
          ).sort();
          setCategories(uniqueCategories);
        }
      }
    } catch (err) {
      setError(`Failed to fetch card items: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedCategory]);

  // Initial load - fetch first 2 months
  useEffect(() => {
    // Reset offset when category changes
    setOffset(0);
    fetchCardItems(0, INITIAL_MONTHS, false);
  }, [fetchCardItems, selectedCategory]);

  // Set up intersection observer for month sections
  useEffect(() => {
    // Only set up if we have items and there's more to load
    if (Object.keys(cardItems).length === 0 || !hasMore || loadingMore || loading) {
      return;
    }

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // Trigger when just 10% of the month section is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          // When the last month section is entering the viewport, load the next month
          const newOffset = offset + INITIAL_MONTHS;
          setOffset(newOffset);
          fetchCardItems(newOffset, MONTHS_PER_SCROLL, true);
        }
      });
    }, options);

    // Get all current month refs
    const currentMonthRefs = Object.values(monthRefs.current).filter(Boolean);
    
    // If there are month refs, observe the last one
    if (currentMonthRefs.length > 0) {
      const lastMonthRef = currentMonthRefs[currentMonthRefs.length - 1];
      if (lastMonthRef) {
        observer.observe(lastMonthRef);
      }
    }

    return () => {
      // Clean up observers
      currentMonthRefs.forEach(ref => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [cardItems, hasMore, loadingMore, loading, offset, fetchCardItems]);

  // Handle edit dialog open
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

  // Handle category change
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  // Reset category filter
  const handleResetFilter = () => {
    setSelectedCategory('');
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Set a ref for a month section
  const setMonthRef = (monthKey: string, element: HTMLDivElement | null) => {
    monthRefs.current[monthKey] = element;
  };

  // Render loading state
  if (loading && Object.keys(cardItems).length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render error state
  if (error && Object.keys(cardItems).length === 0) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Card Items
        </Typography>
        
        {/* Category Filter */}
        <Box mt={2} mb={3} display="flex" alignItems="center">
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel id="category-filter-label">Filter by Category</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter"
              value={selectedCategory}
              label="Filter by Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" onClick={handleResetFilter}>
            Reset Filter
          </Button>
        </Box>
      </Box>

      {/* Card Items List */}
      <CardItemsList 
        cardItems={cardItems} 
        onEdit={handleEditClick} 
        onDelete={handleDeleteClick}
        setMonthRef={setMonthRef}
      />

      {/* Loading indicator */}
      {loadingMore && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={30} />
        </Box>
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
