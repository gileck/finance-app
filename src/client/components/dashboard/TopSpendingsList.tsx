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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';

interface TopSpendingsListProps {
  items: CardItem[];
  loading: boolean;
  limit?: number;
}

interface GroupedItem {
  name: string;
  displayName: string;
  category: string;
  total: number;
  count: number;
  currency: string;
}

export const TopSpendingsList: React.FC<TopSpendingsListProps> = ({
  items,
  loading,
  limit = 5
}) => {
  const theme = useTheme();
  
  // Group items by name
  const groupItemsByName = (): GroupedItem[] => {
    const grouped: Record<string, GroupedItem> = {};
    
    items.forEach(item => {
      const name = item.Name;
      const key = name.toLowerCase().replace(/\s+/g, '_');
      
      if (!grouped[key]) {
        grouped[key] = {
          name: name,
          displayName: item.DisplayName || name,
          category: item.Category,
          total: 0,
          count: 0,
          currency: item.Currency
        };
      }
      
      grouped[key].total += item.Amount;
      grouped[key].count += 1;
    });
    
    // Sort by total (descending) and take top items
    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  };
  
  const groupedItems = groupItemsByName();

  if (loading) {
    return (
      <DashboardCard 
        title="Top Expenses" 
        icon={<TrendingUpIcon />}
        color="error"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <CircularProgress size={40} />
        </Box>
      </DashboardCard>
    );
  }

  if (groupedItems.length === 0) {
    return (
      <DashboardCard 
        title="Top Expenses" 
        icon={<TrendingUpIcon />}
        color="error"
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
      title="Top Expenses" 
      icon={<TrendingUpIcon />}
      color="error"
    >
      <List disablePadding sx={{ minHeight: 150 }}>
        {groupedItems.map((item, index) => {
          const color = getCategoryColor(item.category, theme);
          return (
            <React.Fragment key={item.name}>
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
                  {getCategoryIcon(item.category)}
                </Avatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'medium',
                          fontSize: { 
                            xs: '0.875rem', 
                            sm: '0.95rem' 
                          },
                          mr: 1,
                          flexGrow: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        {item.displayName}
                        {item.count > 1 && (
                        <Chip
                          label={`x${item.count}`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: 'transparent',
                            mr: 1
                          }}
                        />
                      )}
                    </Typography>
                    </Box>
                  }
                  secondary={
                    <Box display="flex" alignItems="center">
                      <Chip
                        label={item.category}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          backgroundColor: alpha(color, 0.1),
                          color: color,
                          maxWidth: 200,
                          '& .MuiChip-label': {
                            px: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }}
                      />
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
                  {formatCurrency(item.total, item.currency)}
                </Typography>
              </ListItem>
              {index < groupedItems.length - 1 && (
                <Divider component="li" sx={{ borderStyle: 'dashed' }} />
              )}
            </React.Fragment>
          );
        })}
      </List>
    </DashboardCard>
  );
};
