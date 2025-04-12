import React from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { MonthlyTotal } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';

interface CurrentMonthSpendingProps {
  currentMonth: MonthlyTotal | null;
  averageSpending: number | null;
  loading: boolean;
}

// Helper to format currency
const formatCurrency = (amount: number, currency: string): string => {
  // For NIS currency, use the ₪ symbol
  if (currency === 'NIS') {
    return `₪${Math.round(amount)}`;
  }
  
  // For other currencies, use the Intl formatter
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

export const CurrentMonthSpending: React.FC<CurrentMonthSpendingProps> = ({
  currentMonth,
  averageSpending,
  loading
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <DashboardCard 
        title="Current Month Spending" 
        icon={<AccountBalanceWalletIcon />}
        color="primary"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <CircularProgress size={40} />
        </Box>
      </DashboardCard>
    );
  }

  if (!currentMonth || averageSpending === null) {
    return (
      <DashboardCard 
        title="Current Month Spending" 
        icon={<AccountBalanceWalletIcon />}
        color="primary"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </DashboardCard>
    );
  }

  const percentOfAverage = (currentMonth.total / averageSpending) * 100;
  const isAboveAverage = percentOfAverage > 100;
  const percentDifference = Math.abs(percentOfAverage - 100).toFixed(1);
  const cardColor = isAboveAverage ? 'error' : 'success';

  return (
    <DashboardCard 
      title="Current Month Spending" 
      icon={<AccountBalanceWalletIcon />}
      color={cardColor}
    >
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        height="100%"
        minHeight={150}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            backgroundColor: theme.palette[cardColor].light,
            opacity: 0.1,
            zIndex: 0
          }
        }}
      >
        <Typography 
          variant="h3" 
          component="p" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            mb: 2,
            zIndex: 1
          }}
        >
          {formatCurrency(currentMonth.total, currentMonth.currency)}
        </Typography>
        
        <Box 
          display="flex" 
          alignItems="center"
          sx={{
            color: theme.palette[cardColor].main,
            backgroundColor: theme.palette[cardColor].light,
            px: 2,
            py: 0.5,
            borderRadius: 4,
            zIndex: 1
          }}
        >
          {isAboveAverage ? (
            <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
          ) : (
            <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
          )}
          <Typography 
            variant="body1" 
            component="span" 
            sx={{ 
              fontWeight: 'medium',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            {percentDifference}% {isAboveAverage ? 'above' : 'below'} average
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          mt={2}
          textAlign="center"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            zIndex: 1
          }}
        >
          Average monthly spending: {formatCurrency(averageSpending, currentMonth.currency)}
        </Typography>
      </Box>
    </DashboardCard>
  );
};
