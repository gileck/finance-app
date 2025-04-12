import React, { useState, useEffect, useMemo } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { getCardItems, getMonthlyTotals } from '@/apis/cardItems/client';
import { CardItem, MonthlyTotal } from '@/apis/cardItems/types';
import { CurrentMonthSpending } from './CurrentMonthSpending';
import { TopSpendingsList } from './TopSpendingsList';
import { TopCategoriesList } from './TopCategoriesList';
import { RecentExpenses } from './RecentExpenses';
import { CategoryPieChart } from './CategoryPieChart';

export const Dashboard: React.FC = () => {
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current month's card items
  useEffect(() => {
    const fetchCurrentMonthItems = async () => {
      setLoadingItems(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JavaScript months are 0-indexed
        
        // Create date range for the current month
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
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
          setCardItems(Object.values(response.data.cardItems));
        }
      } catch (err) {
        setError(`Failed to fetch card items: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchCurrentMonthItems();
  }, []);

  // Get monthly totals
  useEffect(() => {
    const fetchMonthlyTotals = async () => {
      setLoadingTotals(true);
      try {
        const response = await getMonthlyTotals({
          pagination: {
            limit: 12 // Get the last 12 months
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

  // Calculate average monthly spending (excluding current month)
  const averageMonthlySpending = useMemo(() => {
    if (monthlyTotals.length <= 1) return null;
    
    // Skip the current month (index 0) and calculate average of previous months
    const previousMonths = monthlyTotals.slice(1);
    if (previousMonths.length === 0) return null;
    
    const sum = previousMonths.reduce((acc, month) => acc + month.total, 0);
    return sum / previousMonths.length;
  }, [monthlyTotals]);

  // Get current month data
  const currentMonth = monthlyTotals.length > 0 ? monthlyTotals[0] : null;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' } 
        }}
      >
        Financial Dashboard
      </Typography> */}
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3
      }}>
        {/* Current Month Spending */}
        <Box sx={{ 
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 3, md: 0 }
        }}>
          <CurrentMonthSpending 
            currentMonth={currentMonth}
            averageSpending={averageMonthlySpending}
            loading={loadingTotals}
          />
        </Box>
        
        {/* Recent Expenses (48h) */}
        <Box sx={{ 
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 3, md: 0 }
        }}>
          <RecentExpenses 
            items={cardItems}
            loading={loadingItems}
            limit={5}
          />
        </Box>
        
        {/* Top Expenses */}
        <Box sx={{ 
          width: { xs: '100%', md: 'calc(50% - 12px)' },
          mb: { xs: 3, md: 0 }
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
          mb: { xs: 3, md: 0 }
        }}>
          <TopCategoriesList 
            items={cardItems}
            loading={loadingItems}
            limit={5}
          />
        </Box>
        
        {/* Category Pie Chart */}
        <Box sx={{ 
          width: { xs: '100%', md: 'calc(100% - 0px)' },
          mb: { xs: 3, md: 0 }
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
