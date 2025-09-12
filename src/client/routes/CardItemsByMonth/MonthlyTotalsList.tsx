import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  Chip,
  List,
  ListItem
} from '@mui/material';
import { MonthlyTotal } from '@/apis/cardItems/types';
import { formatCurrency } from '@/client/utils/categoryUtils';
import { useRouter } from '@/client/router';

// Define valid color options for MUI Chip
type ChipColorType = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

interface MonthlyTotalsListProps {
  monthlyTotals: MonthlyTotal[];
  average: number;
  setMonthRef?: (monthKey: string, element: HTMLDivElement | null) => void;
}

// removed local currency formatter in favor of shared NIS formatter

// Helper to format percentage
const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Helper to determine color based on percentage
const getPercentageColor = (percentage: number): ChipColorType => {
  if (percentage > 15) return 'error';
  if (percentage > 5) return 'warning';
  if (percentage < -15) return 'success';
  if (percentage < -5) return 'info';
  return 'default';
};

export const MonthlyTotalsList: React.FC<MonthlyTotalsListProps> = ({
  monthlyTotals,
  average,
  setMonthRef
}) => {
  const router = useRouter();

  // Handle month click to navigate to detail view
  const handleMonthClick = (year: number, month: string) => {
    router.navigate(`/card-items-by-month-detail/${year}/${month}`);
  };

  if (monthlyTotals.length === 0) {
    return (
      <Box mt={4} textAlign="center">
        <Typography variant="body1" color="text.secondary">
          No monthly data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      <List disablePadding>
        {monthlyTotals.map((monthlyTotal, index) => {
          const monthKey = `${monthlyTotal.year}-${monthlyTotal.month}`;

          // Calculate percentage from average
          const percentageFromAverage = average > 0
            ? ((monthlyTotal.total - average) / average) * 100
            : 0;

          // Determine color based on percentage
          const percentageColor = getPercentageColor(percentageFromAverage);

          return (
            <React.Fragment key={monthKey}>
              <Box
                component={ListItem}
                ref={(element: HTMLDivElement | null) => setMonthRef && setMonthRef(monthKey, element)}
                onClick={() => handleMonthClick(monthlyTotal.year, monthlyTotal.month)}
                sx={{
                  py: 2,
                  px: 3,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  {monthlyTotal.monthName}
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={formatPercentage(percentageFromAverage)}
                    color={percentageColor}
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      minWidth: '70px'
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight="medium">
                    {formatCurrency(monthlyTotal.total, monthlyTotal.currency)}
                  </Typography>
                </Box>
              </Box>
              {index < monthlyTotals.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};
