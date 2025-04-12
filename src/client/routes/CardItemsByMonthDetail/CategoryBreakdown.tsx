import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box,
  List,
  ListItem,
  Divider,
  Chip,
  Collapse,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton
} from '@mui/material';
import { 
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import { CardItem } from '@/apis/cardItems/types';

interface CategoryBreakdownProps {
  cardItems: Record<string, CardItem>;
}

interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
  count: number;
  items: CardItem[];
  groupedItems: GroupedItems;
}

interface ItemGroup {
  name: string;
  displayName: string;
  items: CardItem[];
  total: number;
  count: number;
}

type GroupedItems = Record<string, ItemGroup>;

// Helper to format currency
const formatCurrency = (amount: number, currency: string): string => {
  // For NIS currency, use the ₪ symbol
  if (currency === 'NIS') {
    return `₪${amount.toFixed(2)}`;
  }
  
  // For other currencies, use the Intl formatter
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

// Helper to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ cardItems }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Group items by name within a category
  const groupItemsByName = (items: CardItem[]): GroupedItems => {
    const grouped: GroupedItems = {};
    
    items.forEach(item => {
      const name = item.Name;
      const key = name.toLowerCase().replace(/\s+/g, '_');
      
      if (!grouped[key]) {
        grouped[key] = {
          name,
          displayName: item.DisplayName || name,
          items: [],
          total: 0,
          count: 0
        };
      }
      
      grouped[key].items.push(item);
      grouped[key].total += item.Amount;
      grouped[key].count += 1;
    });
    
    return grouped;
  };

  // Calculate totals by category
  const calculateCategoryTotals = (): CategoryTotal[] => {
    const categories: Record<string, CategoryTotal> = {};
    let grandTotal = 0;
    
    // First pass: calculate totals per category and grand total
    Object.values(cardItems).forEach(item => {
      const { Category, Amount } = item;
      
      if (!categories[Category]) {
        categories[Category] = {
          category: Category,
          total: 0,
          percentage: 0,
          count: 0,
          items: [],
          groupedItems: {}
        };
      }
      
      categories[Category].total += Amount;
      categories[Category].count += 1;
      categories[Category].items.push(item);
      grandTotal += Amount;
    });
    
    // Second pass: calculate percentages and group items
    if (grandTotal > 0) {
      Object.values(categories).forEach(category => {
        category.percentage = (category.total / grandTotal) * 100;
        category.groupedItems = groupItemsByName(category.items);
      });
    }
    
    // Sort by total (descending)
    return Object.values(categories).sort((a, b) => b.total - a.total);
  };
  
  const categoryTotals = calculateCategoryTotals();
  const currency = Object.values(cardItems)[0]?.Currency || 'NIS';
  
  if (categoryTotals.length === 0) {
    return null;
  }
  
  return (
    <Paper elevation={2} sx={{ mb: 4 }}>
      <List disablePadding>
        {categoryTotals.map((category, index) => {
          const isExpanded = !!expandedCategories[category.category];
          
          return (
            <React.Fragment key={category.category}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => toggleCategoryExpansion(category.category)}
                  sx={{
                    py: 2,
                    px: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box display="flex" flexDirection="column" flex={1}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {category.category}
                      </Typography>
                      <Chip 
                        label={`${category.count} items`}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {category.percentage.toFixed(1)}% of monthly spend
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ mr: 1 }}>
                      {formatCurrency(category.total, currency)}
                    </Typography>
                    {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </Box>
                </ListItemButton>
              </ListItem>
              
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {Object.entries(category.groupedItems).map(([groupKey, group], groupIndex) => {
                    const isGroupExpanded = !!expandedGroups[`${category.category}_${groupKey}`];
                    const groupFullKey = `${category.category}_${groupKey}`;
                    const isLastGroup = groupIndex === Object.keys(category.groupedItems).length - 1;
                    
                    return (
                      <React.Fragment key={groupKey}>
                        <ListItem 
                          sx={{ 
                            py: 1.5, 
                            px: 4,
                            bgcolor: 'action.hover',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => toggleGroupExpansion(groupFullKey, e)}
                        >
                          <Box display="flex" flexDirection="column" flex={1}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="body1" fontWeight="medium">
                                {group.displayName}
                              </Typography>
                              <Chip 
                                label={`${group.count}x`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          </Box>
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1" fontWeight="medium" sx={{ mr: 1 }}>
                              {formatCurrency(group.total, currency)}
                            </Typography>
                            {isGroupExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                          </Box>
                        </ListItem>
                        
                        <Divider variant="inset" component="li" sx={{ ml: 4 }} />
                        
                        <Collapse in={isGroupExpanded} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {group.items.map((item, itemIndex) => (
                              <React.Fragment key={item.id}>
                                <ListItem 
                                  sx={{ 
                                    py: 1, 
                                    px: 6,
                                    bgcolor: 'background.paper'
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2" color="text.secondary">
                                        {formatDate(item.Date)}
                                      </Typography>
                                    }
                                  />
                                  <ListItemSecondaryAction>
                                    <Typography variant="body2">
                                      {formatCurrency(item.Amount, item.Currency)}
                                    </Typography>
                                  </ListItemSecondaryAction>
                                </ListItem>
                                {itemIndex < group.items.length - 1 && (
                                  <Divider variant="inset" component="li" sx={{ ml: 6 }} />
                                )}
                              </React.Fragment>
                            ))}
                          </List>
                        </Collapse>
                        
                        {!isLastGroup && (
                          <Divider component="li" sx={{ ml: 0 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Collapse>
              
              {index < categoryTotals.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};
