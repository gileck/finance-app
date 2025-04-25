import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import CategoryIcon from '@mui/icons-material/Category';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { CategoryItemsDialog } from './CategoryItemsDialog';

interface TopCategoriesListProps {
  items: CardItem[];
  loading: boolean;
  limit?: number;
}

interface CategoryTotal {
  name: string;
  total: number;
  percentage: number;
  count: number;
}

export const TopCategoriesList: React.FC<TopCategoriesListProps> = ({
  items,
  loading,
  limit = 5
}) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Calculate totals by category
  const calculateCategoryTotals = (): CategoryTotal[] => {
    const categories: Record<string, CategoryTotal> = {};
    let grandTotal = 0;
    
    // First pass: calculate totals per category and grand total
    items.forEach(item => {
      const { Category, Amount } = item;
      
      if (!categories[Category]) {
        categories[Category] = {
          name: Category,
          total: 0,
          percentage: 0,
          count: 0
        };
      }
      
      categories[Category].total += Amount;
      categories[Category].count += 1;
      grandTotal += Amount;
    });
    
    // Second pass: calculate percentages
    if (grandTotal > 0) {
      Object.values(categories).forEach(category => {
        category.percentage = (category.total / grandTotal) * 100;
      });
    }
    
    // Sort by total (descending) and take top categories
    return Object.values(categories)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  };

  const categoryTotals = calculateCategoryTotals();
  const currency = items.length > 0 ? items[0].Currency : 'NIS';

  if (loading) {
    return (
      <DashboardCard 
        title="Top Categories" 
        icon={<CategoryIcon />}
        color="primary"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <CircularProgress size={40} />
        </Box>
      </DashboardCard>
    );
  }

  if (categoryTotals.length === 0) {
    return (
      <DashboardCard 
        title="Top Categories" 
        icon={<CategoryIcon />}
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

  // Find the highest total for progress bar calculation
  const maxTotal = Math.max(...categoryTotals.map(cat => cat.total));

  return (
    <DashboardCard 
      title="Top Categories" 
      icon={<CategoryIcon />}
      color="primary"
    >
      <List disablePadding sx={{ minHeight: 150 }}>
        {categoryTotals.map((category, index) => {
          const color = getCategoryColor(category.name, theme);
          const progressPercentage = (category.total / maxTotal) * 100;
          
          return (
            <React.Fragment key={category.name}>
              <ListItem 
                sx={{ 
                  py: 1.5,
                  px: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  },
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedCategory(category.name)}
              >
                <Box width="100%" display="flex" alignItems="center" mb={0.5}>
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: alpha(color, 0.1),
                      color: color,
                      mr: 1.5
                    }}
                  >
                    {getCategoryIcon(category.name)}
                  </Box>
                  <Box flexGrow={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'medium',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' }
                        }}
                      >
                        {category.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' }
                        }}
                      >
                        {formatCurrency(category.total, currency)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Box width="100%" mr={2}>
                        <LinearProgress 
                          variant="determinate" 
                          value={progressPercentage} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: alpha(color, 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: color,
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          minWidth: '50px',
                          textAlign: 'right',
                          fontSize: '0.75rem' 
                        }}
                      >
                        {category.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </ListItem>
              {index < categoryTotals.length - 1 && (
                <Divider component="li" sx={{ borderStyle: 'dashed' }} />
              )}
            </React.Fragment>
          );
        })}
      </List>
      
      {/* Category Items Dialog */}
      {selectedCategory && (
        <CategoryItemsDialog
          open={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          items={items.filter(item => item.Category === selectedCategory)}
        />
      )}
    </DashboardCard>
  );
};
