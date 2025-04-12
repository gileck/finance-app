import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  getCardItems
} from '@/apis/cardItems/client';
import { CardItem, GetCardItemsRequest } from '@/apis/cardItems/types';
import { CardItemsList } from './CardItemsList';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem, deleteCardItem } from '@/client/utils/cardItemOperations';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { AdvancedFilterDialog, FilterOptions } from '@/client/components/filters/AdvancedFilterDialog';
import { format } from 'date-fns';

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
  
  // Advanced filter states
  const [openFilterDialog, setOpenFilterDialog] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    categories: [],
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
    searchTerm: '',
    sortBy: 'date',
    sortDirection: 'desc',
    pendingTransactionOnly: false
  });
  const [hasActiveFilters, setHasActiveFilters] = useState<boolean>(false);

  // References for infinite scrolling
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Update hasActiveFilters when activeFilters change
  useEffect(() => {
    const isActive = 
      (activeFilters.categories && activeFilters.categories.length > 0) ||
      activeFilters.startDate !== null ||
      activeFilters.endDate !== null ||
      activeFilters.minAmount !== null ||
      activeFilters.maxAmount !== null ||
      (activeFilters.searchTerm && activeFilters.searchTerm.trim() !== '') ||
      (activeFilters.sortBy && activeFilters.sortBy !== 'date') ||
      (activeFilters.sortDirection && activeFilters.sortDirection !== 'desc') ||
      activeFilters.pendingTransactionOnly === true;
    
    setHasActiveFilters(isActive);
  }, [activeFilters]);

  // Convert filter options to API request format
  const createFilterRequest = useCallback((currentOffset: number, limit: number): GetCardItemsRequest => {
    const request: GetCardItemsRequest = {
      pagination: {
        limit,
        offset: currentOffset
      }
    };

    // Build filter object
    type FilterType = {
      categories?: string[];
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      searchTerm?: string;
      sortBy?: string;
      sortDirection?: string;
      pendingTransactionOnly?: boolean;
    };
    
    const filter: FilterType = {};
    
    // Add categories
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      filter.categories = activeFilters.categories;
    }
    
    // Add date range
    if (activeFilters.startDate) {
      filter.startDate = format(activeFilters.startDate, 'yyyy-MM-dd');
    }
    
    if (activeFilters.endDate) {
      filter.endDate = format(activeFilters.endDate, 'yyyy-MM-dd');
    }
    
    // Add amount range
    if (activeFilters.minAmount !== null) {
      filter.minAmount = activeFilters.minAmount;
    }
    
    if (activeFilters.maxAmount !== null) {
      filter.maxAmount = activeFilters.maxAmount;
    }
    
    // Add search term
    if (activeFilters.searchTerm && activeFilters.searchTerm.trim() !== '') {
      filter.searchTerm = activeFilters.searchTerm.trim();
    }
    
    // Add sorting
    if (activeFilters.sortBy) {
      filter.sortBy = activeFilters.sortBy;
    }
    
    if (activeFilters.sortDirection) {
      filter.sortDirection = activeFilters.sortDirection;
    }
    
    // Add pending transaction filter
    if (activeFilters.pendingTransactionOnly) {
      filter.pendingTransactionOnly = true;
    }
    
    // Only add filter object if it has properties
    if (Object.keys(filter).length > 0) {
      request.filter = filter;
    }
    
    return request;
  }, [activeFilters]);

  // Fetch card items with pagination and filters
  const fetchCardItems = useCallback(async (currentOffset: number, limit: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const request = createFilterRequest(currentOffset, limit);
      const response = await getCardItems(request);

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
  }, [createFilterRequest]);

  // Initial load - fetch first 2 months
  useEffect(() => {
    // Reset offset when filters change
    setOffset(0);
    fetchCardItems(0, INITIAL_MONTHS, false);
  }, [fetchCardItems, activeFilters]);

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

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      const result = await deleteCardItem(itemToDelete);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.severity
      });
      
      if (result.success) {
        // Remove item from local state
        setCardItems(prevItems => {
          const newItems = { ...prevItems };
          delete newItems[itemToDelete];
          return newItems;
        });
      }
      
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Handle filter dialog open
  const handleOpenFilterDialog = () => {
    setOpenFilterDialog(true);
  };

  // Handle filter dialog close
  const handleCloseFilterDialog = () => {
    setOpenFilterDialog(false);
  };

  // Handle apply filters
  const handleApplyFilters = (newFilters: FilterOptions) => {
    setActiveFilters(newFilters);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setActiveFilters({
      categories: [],
      startDate: null,
      endDate: null,
      minAmount: null,
      maxAmount: null,
      searchTerm: '',
      sortBy: 'date',
      sortDirection: 'desc',
      pendingTransactionOnly: false
    });
  };

  // Render active filter chips
  const renderFilterChips = () => {
    const chips = [];
    
    // Category chips
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      activeFilters.categories.forEach(category => {
        chips.push(
          <Chip 
            key={`category-${category}`}
            label={`Category: ${category}`}
            onDelete={() => {
              setActiveFilters({
                ...activeFilters,
                categories: activeFilters.categories?.filter(c => c !== category) || []
              });
            }}
            color="primary"
            variant="outlined"
            size="small"
          />
        );
      });
    }
    
    // Date range chips
    if (activeFilters.startDate) {
      chips.push(
        <Chip 
          key="start-date"
          label={`From: ${format(activeFilters.startDate, 'MMM d, yyyy')}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              startDate: null
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    if (activeFilters.endDate) {
      chips.push(
        <Chip 
          key="end-date"
          label={`To: ${format(activeFilters.endDate, 'MMM d, yyyy')}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              endDate: null
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    // Amount range chips
    if (activeFilters.minAmount !== null) {
      chips.push(
        <Chip 
          key="min-amount"
          label={`Min: ₪${activeFilters.minAmount}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              minAmount: null
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    if (activeFilters.maxAmount !== null) {
      chips.push(
        <Chip 
          key="max-amount"
          label={`Max: ₪${activeFilters.maxAmount}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              maxAmount: null
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    // Search term chip
    if (activeFilters.searchTerm && activeFilters.searchTerm.trim() !== '') {
      chips.push(
        <Chip 
          key="search-term"
          label={`Search: ${activeFilters.searchTerm}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              searchTerm: ''
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    // Sort chips
    if (activeFilters.sortBy && activeFilters.sortBy !== 'date') {
      chips.push(
        <Chip 
          key="sort-by"
          label={`Sort by: ${activeFilters.sortBy}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              sortBy: 'date'
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    if (activeFilters.sortDirection && activeFilters.sortDirection !== 'desc') {
      chips.push(
        <Chip 
          key="sort-direction"
          label={`Order: ${activeFilters.sortDirection}`}
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              sortDirection: 'desc'
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    // Pending transaction chip
    if (activeFilters.pendingTransactionOnly) {
      chips.push(
        <Chip 
          key="pending-transaction"
          label="Pending transactions only"
          onDelete={() => {
            setActiveFilters({
              ...activeFilters,
              pendingTransactionOnly: false
            });
          }}
          color="primary"
          variant="outlined"
          size="small"
        />
      );
    }
    
    return chips;
  };

  // Render loading state
  if (loading && Object.keys(cardItems).length === 0) {
    return (
      <Container maxWidth="lg">
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="50vh"
        >
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
        
        {/* Filter Controls */}
        <Box mt={2} mb={3}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FilterListIcon />}
              onClick={handleOpenFilterDialog}
              sx={{ height: 40 }}
            >
              Advanced Filters
            </Button>
            
            {hasActiveFilters && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ flex: 1 }}>
                {renderFilterChips()}
                
                <Tooltip title="Clear all filters">
                  <IconButton 
                    size="small" 
                    onClick={handleClearAllFilters}
                    color="primary"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Box>
        
        {/* Card Items List */}
        <CardItemsList 
          cardItems={cardItems} 
          onEditClick={handleEditClick} 
          onDeleteClick={handleDeleteClick}
          monthRefs={monthRefs}
        />
        
        {/* Loading more indicator */}
        {loadingMore && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress size={30} />
          </Box>
        )}
        
        {/* No more items indicator */}
        {!hasMore && Object.keys(cardItems).length > 0 && (
          <Box textAlign="center" my={4}>
            <Typography variant="body2" color="textSecondary">
              No more items to load
            </Typography>
          </Box>
        )}
        
        {/* No items found with filters */}
        {!loading && Object.keys(cardItems).length === 0 && hasActiveFilters && (
          <Box textAlign="center" my={4}>
            <Typography variant="body1" color="textSecondary">
              No items found with the current filters
            </Typography>
            <Button 
              variant="text" 
              color="primary" 
              onClick={handleClearAllFilters}
              sx={{ mt: 2 }}
            >
              Clear All Filters
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Edit Dialog */}
      {editItem && (
        <CardItemEditDialog
          open={openDialog}
          onClose={handleCloseDialog}
          cardItem={editItem}
          onSave={handleSaveChanges}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Advanced Filter Dialog */}
      <AdvancedFilterDialog
        open={openFilterDialog}
        onClose={handleCloseFilterDialog}
        onApplyFilters={handleApplyFilters}
        availableCategories={categories}
        currentFilters={activeFilters}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
