import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import { MonthlyTotal } from '@/apis/cardItems/types';
import { formatCurrency } from '@/client/utils/categoryUtils';
import { DashboardCard } from './DashboardCard';
import HistoryIcon from '@mui/icons-material/History';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface PreviousMonthsListProps {
  months: MonthlyTotal[];
  loading: boolean;
  limit?: number;
}

// removed local currency helper in favor of shared NIS formatter

export const PreviousMonthsList: React.FC<PreviousMonthsListProps> = ({
  months,
  loading,
  limit = 5
}) => {
  const theme = useTheme();
  // Take the most recent months, excluding the current month
  const recentMonths = months.slice(1, limit + 1);

  if (loading) {
    return (
      <DashboardCard
        title="Previous Months"
        icon={<HistoryIcon />}
        color="info"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <CircularProgress size={40} />
        </Box>
      </DashboardCard>
    );
  }

  if (recentMonths.length === 0) {
    return (
      <DashboardCard
        title="Previous Months"
        icon={<HistoryIcon />}
        color="info"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Previous Months"
      icon={<HistoryIcon />}
      color="info"
    >
      <List disablePadding sx={{ minHeight: 150 }}>
        {recentMonths.map((month, index) => {
          const date = new Date(`${month.year}-${month.month}-01`);
          const monthName = date.toLocaleString('default', { month: 'long' });
          const yearNum = date.getFullYear();

          // Generate a color based on the month (cycling through a few colors)
          const colorIndex = parseInt(month.month) % 5;
          const colors = [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main
          ];
          const color = colors[colorIndex];

          return (
            <React.Fragment key={`${month.year}-${month.month}`}>
              <ListItem
                disableGutters
                sx={{
                  py: 1.5,
                  px: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha(color, 0.1),
                    color: color,
                    mr: 2
                  }}
                >
                  <CalendarMonthIcon fontSize="small" />
                </Box>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 'medium',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          mr: 1
                        }}
                      >
                        {monthName}
                      </Typography>
                      <Chip
                        label={yearNum}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: alpha(color, 0.1),
                          color: color
                        }}
                      />
                    </Box>
                  }
                />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                    fontSize: { xs: '0.875rem', sm: '0.95rem' }
                  }}
                >
                  {formatCurrency(month.total, month.currency)}
                </Typography>
              </ListItem>
              {index < recentMonths.length - 1 && (
                <Divider component="li" sx={{ borderStyle: 'dashed' }} />
              )}
            </React.Fragment>
          );
        })}
      </List>
    </DashboardCard>
  );
};
