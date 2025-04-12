import React, { useState, useEffect, useCallback } from 'react';
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
  Paper,
  Divider
} from '@mui/material';
import { getMonthlyTotals } from '@/apis/cardItems/client';
import { MonthlyTotal } from '@/apis/cardItems/types';
import { MonthlyTotalsList } from './MonthlyTotalsList';

export const CardItemsByMonth = () => {
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  // Calculate statistics for the last 12 months
  const calculateStats = (totals: MonthlyTotal[]) => {
    if (totals.length === 0) return { average: 0, median: 0 };
    
    // Get last 12 months or all if less than 12
    const last12Months = totals.slice(0, Math.min(12, totals.length));
    const values = last12Months.map(item => item.total);
    
    // Calculate average
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    
    // Calculate median
    const sortedValues = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
      : sortedValues[middle];
    
    return { average, median };
  };

  // Fetch all monthly totals
  const fetchMonthlyTotals = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getMonthlyTotals({
        filter: selectedCategory ? { category: selectedCategory } : undefined
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMonthlyTotals(response.data.monthlyTotals);
        
        // Set categories if available
        if (response.data.categories) {
          setCategories(response.data.categories);
        }
      }
    } catch (err) {
      setError(`Failed to fetch monthly totals: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Load all data on initial render and when category changes
  useEffect(() => {
    fetchMonthlyTotals();
  }, [fetchMonthlyTotals, selectedCategory]);

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

  // Calculate stats for display
  const stats = calculateStats(monthlyTotals);

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
  if (error && monthlyTotals.length === 0) {
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
          Monthly Totals
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

      {/* Statistics Summary */}
      {monthlyTotals.length > 0 && (
        <Paper elevation={3} sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Last 12 Months Statistics
          </Typography>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Average Monthly Spend
              </Typography>
              <Typography variant="h5">
                {monthlyTotals[0]?.currency === 'NIS' 
                  ? `₪${stats.average.toFixed(2)}` 
                  : new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: monthlyTotals[0]?.currency || 'USD'
                    }).format(stats.average)
                }
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Divider sx={{ display: { xs: 'block', sm: 'none' } }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Median Monthly Spend
              </Typography>
              <Typography variant="h5">
                {monthlyTotals[0]?.currency === 'NIS' 
                  ? `₪${stats.median.toFixed(2)}` 
                  : new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: monthlyTotals[0]?.currency || 'USD'
                    }).format(stats.median)
                }
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Monthly Totals List */}
      <MonthlyTotalsList 
        monthlyTotals={monthlyTotals}
        average={stats.average}
      />

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
