import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress,
  Divider,
  Avatar,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';

interface RecentExpensesProps {
  items: CardItem[];
  loading: boolean;
  limit?: number;
}

// Function to format time relative to now
const formatRelativeTime = (dateString: string): string => {
  const isToday = new Date(dateString).toDateString() === new Date().toDateString();
  
  const yesterdayDate = new Date().getDate() - 1;
  const isYesterday = new Date(dateString).getDate() === yesterdayDate;
  
  if (isToday) {
    return 'Today';
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return 'More than 2 days ago'
  }
};

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  items,
  loading,
  limit = 5
}) => {
  const theme = useTheme();
  
  // Filter items from the last 48 hours
  const getRecentItems = (): CardItem[] => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    return items
      .filter(item => new Date(item.Date) >= twoDaysAgo)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, limit);
  };
  
  const recentItems = getRecentItems();

  if (loading) {
    return (
      <DashboardCard 
        title="Recent Expenses (48h)" 
        icon={<AccessTimeIcon />}
        color="info"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <CircularProgress size={40} />
        </Box>
      </DashboardCard>
    );
  }

  if (recentItems.length === 0) {
    return (
      <DashboardCard 
        title="Recent Expenses (48h)" 
        icon={<AccessTimeIcon />}
        color="info"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <Typography variant="body1" color="text.secondary">
            No recent transactions
          </Typography>
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard 
      title="Recent Expenses (48h)" 
      icon={<AccessTimeIcon />}
      color="info"
    >
      <List disablePadding sx={{ minHeight: 150 }}>
        {recentItems.map((item, index) => {
          const color = getCategoryColor(item.Category, theme);
          return (
            <React.Fragment key={item.id}>
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
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(color, 0.1), 
                    color: color,
                    mr: 2,
                    width: 36,
                    height: 36
                  }}
                >
                  {getCategoryIcon(item.Category)}
                </Avatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'medium',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          mr: 1,
                          flexGrow: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.DisplayName || item.Name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={item.Category}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: alpha(color, 0.1),
                          color: color,
                          maxWidth: 80,
                          '& .MuiChip-label': {
                            px: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {formatRelativeTime(item.Date)}
                      </Typography>
                    </Box>
                  }
                  sx={{ my: 0 }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.875rem', sm: '0.95rem' }
                  }}
                >
                  {formatCurrency(item.Amount, item.Currency)}
                </Typography>
              </ListItem>
              {index < recentItems.length - 1 && (
                <Divider component="li" sx={{ borderStyle: 'dashed' }} />
              )}
            </React.Fragment>
          );
        })}
      </List>
    </DashboardCard>
  );
};
