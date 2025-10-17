import React, { useState, useEffect, useMemo } from 'react';
import { Box, Alert, Paper, Typography, IconButton, Stack } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getCardItems, getMonthlyTotals } from '@/apis/cardItems/client';
import { CardItem, MonthlyTotal } from '@/apis/cardItems/types';
import { CurrentMonthSpending } from './CurrentMonthSpending';
import { TopSpendingsList } from './TopSpendingsList';
import { TopCategoriesList } from './TopCategoriesList';
import { RecentExpenses } from './RecentExpenses';
import { CategoryPieChart } from './CategoryPieChart';
import { RecurringTransactions } from './RecurringTransactions';
import { PendingItems } from './PendingItems';
// import { UncategorizedItems } from './UncategorizedItems';
import { MoneyTransfersMonthList } from './MoneyTransfersMonthList';

export const Dashboard: React.FC = () => {
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month/Year selection state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1; // JavaScript months are 0-indexed
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });

  // Navigation functions
  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Check if we can navigate
  const canGoNext = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return !(selectedMonth === currentMonth && selectedYear === currentYear);
  }, [selectedMonth, selectedYear]);

  const canGoPrev = useMemo(() => {
    if (monthlyTotals.length === 0) return false;

    // Find the earliest month we have data for
    const sortedTotals = [...monthlyTotals].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return parseInt(a.month) - parseInt(b.month);
    });

    if (sortedTotals.length === 0) return false;

    const earliestMonth = sortedTotals[0];
    const earliestMonthNum = parseInt(earliestMonth.month);

    return !(selectedMonth === earliestMonthNum && selectedYear === earliestMonth.year);
  }, [selectedMonth, selectedYear, monthlyTotals]);

  // Format selected month for display
  const formatSelectedMonth = () => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Handlers removed (no longer used in current dashboard composition)

  // Get card items for selected month
  useEffect(() => {
    const fetchMonthItems = async () => {
      setLoadingItems(true);
      try {
        // Create date range for the selected month
        const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

        const response = await getCardItems({
          filter: {
            startDate,
            endDate
          }
        });

        if (response.data.error) {
          setError(response.data.error);
        } else {
          setCardItems(Object.values(response.data.cardItems));
        }
      } catch (err) {
        setError(`Failed to fetch card items: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchMonthItems();
  }, [selectedMonth, selectedYear]);

  // Get monthly totals
  useEffect(() => {
    const fetchMonthlyTotals = async () => {
      setLoadingTotals(true);
      try {
        const response = await getMonthlyTotals({
          pagination: {
            limit: 24 // Get the last 24 months for better navigation
          }
        });

        if (response.data.error) {
          setError(response.data.error);
        } else {
          // Sort by year and month (descending)
          const sortedTotals = [...response.data.monthlyTotals].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return parseInt(b.month) - parseInt(a.month);
          });

          setMonthlyTotals(sortedTotals);
        }
      } catch (err) {
        setError(`Failed to fetch monthly totals: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoadingTotals(false);
      }
    };

    fetchMonthlyTotals();
  }, []);

  // Calculate average monthly spending (excluding selected month)
  const averageMonthlySpending = useMemo(() => {
    if (monthlyTotals.length <= 1) return null;

    // Filter out the selected month and calculate average of other months
    const otherMonths = monthlyTotals.filter(month =>
      !(parseInt(month.month) === selectedMonth && month.year === selectedYear)
    );

    if (otherMonths.length === 0) return null;

    const sum = otherMonths.reduce((acc, month) => acc + month.total, 0);
    return sum / otherMonths.length;
  }, [monthlyTotals, selectedMonth, selectedYear]);

  // Get selected month data
  const selectedMonthData = monthlyTotals.find(month =>
    parseInt(month.month) === selectedMonth && month.year === selectedYear
  ) || null;

  return (
    <Box sx={{ width: '100%', mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 0 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, mx: { xs: 1, sm: 0 } }}>
          {error}
        </Alert>
      )}

      {/* Month Navigation */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="center">
          <IconButton
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            size="large"
            sx={{
              '&:disabled': {
                opacity: 0.3
              },
              minWidth: 48,
              minHeight: 48,
              p: 1.5,
              mr: { xs: 1, sm: 2 }
            }}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>

          <Typography
            variant="h5"
            component="h1"
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              px: { xs: 1, sm: 2 },
              color: 'primary.main'
            }}
          >
            {formatSelectedMonth()}
          </Typography>

          <IconButton
            onClick={goToNextMonth}
            disabled={!canGoNext}
            size="large"
            sx={{
              '&:disabled': {
                opacity: 0.3
              },
              minWidth: 48,
              minHeight: 48,
              p: 1.5,
              ml: { xs: 1, sm: 2 }
            }}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        </Stack>
      </Paper>

      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: { xs: 2, sm: 3 }
      }}>
        {/* Current Month Spending */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <CurrentMonthSpending
            currentMonth={selectedMonthData}
            averageSpending={averageMonthlySpending}
            loading={loadingTotals}
          />
        </Box>

        {/* Recent Expenses (48h) */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <RecentExpenses
            items={cardItems}
            loading={loadingItems}
            limit={5}
          />
        </Box>
      </Box>

      {/* Second row */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        mb: { xs: 1, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        {/* Top Spendings List */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <TopSpendingsList
            items={cardItems}
            loading={loadingItems}
            limit={5}
          />
        </Box>

        {/* Top Categories List */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <TopCategoriesList
            items={cardItems}
            loading={loadingItems}
            limit={5}
          />
        </Box>
      </Box>

      {/* Third row */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        mb: { xs: 1, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        {/* Recurring Transactions */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <RecurringTransactions limit={10} />
        </Box>

        {/* Money Transfers This Month */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <MoneyTransfersMonthList
            items={cardItems}
            loading={loadingItems}
            limit={6}
          />
        </Box>
      </Box>

      {/* Fourth row */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        mb: { xs: 1, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        {/* Pending Items */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <PendingItems
            items={cardItems}
            loading={loadingItems}
          />
        </Box>

        {/* Category Pie Chart */}
        <Box sx={{
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 1, md: 0 }
        }}>
          <CategoryPieChart
            items={cardItems}
            loading={loadingItems}
          />
        </Box>
      </Box>
    </Box>
  );
};
