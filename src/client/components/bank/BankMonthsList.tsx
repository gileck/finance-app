import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  CircularProgress, 
  useTheme, 
  Collapse, 
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { MonthlyBankTotal, BankItem } from '@/apis/bankItems/types';
import { BankMonthDetailsDialog } from './BankMonthDetailsDialog';
import { BankItemEditDialog } from './BankItemEditDialog';
import { updateBankItem } from '@/client/utils/bankItemOperations';

interface BankMonthsListProps {
  months: MonthlyBankTotal[];
  items: Record<string, BankItem>;
  loading: boolean;
  onItemUpdated?: (item: BankItem) => void;
}

export const BankMonthsList: React.FC<BankMonthsListProps> = ({ 
  months, 
  items, 
  loading,
  onItemUpdated 
}) => {
  const theme = useTheme();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<BankItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [localItems, setLocalItems] = useState<Record<string, BankItem>>(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleExpand = (monthKey: string) => {
    setExpandedMonth(expandedMonth === monthKey ? null : monthKey);
  };

  const handleGroupToggle = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleItemClick = (item: BankItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDetailsDialogOpen(false);
    setSelectedItem(null);
  };

  const handleEditClick = (item: BankItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  const handleSaveItem = async (updatedItem: BankItem) => {
    try {
      const result = await updateBankItem(updatedItem);
      
      if (result.success && result.updatedItem) {
        const updatedItems = {
          ...localItems,
          [updatedItem.id]: result.updatedItem
        };
        setLocalItems(updatedItems);
        
        if (onItemUpdated) {
          onItemUpdated(result.updatedItem);
        }
      }
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving bank item:', error);
    }
  };

  // Calculate income and expenses for each month
  const calculateMonthStats = (monthItems: BankItem[]) => {
    let income = 0;
    let expenses = 0;

    monthItems.forEach(item => {
      if (item.Amount >= 0) {
        income += item.Amount;
      } else {
        expenses += Math.abs(item.Amount);
      }
    });

    return { income, expenses, balance: income - expenses };
  };

  const formatCurrency = (amount: number): string => {
    return `₪${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Format month in compact way (MM/YY)
  const formatCompactMonth = (monthName: string, year: number, monthNumber?: string): string => {
    // If monthNumber is provided, use it directly
    if (monthNumber) {
      const yearShort = year.toString().slice(2);
      return `${monthNumber}/${yearShort}`;
    }
    
    // Otherwise try to convert from month name
    const monthMap: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    
    const monthNum = monthMap[monthName] || 1;
    const yearShort = year.toString().slice(2);
    
    return `${monthNum}/${yearShort}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!months.length) {
    return <Typography>No bank transactions found.</Typography>;
  }

  // Group months by year
  const groupMonthsByYear = () => {
    const grouped: Record<number, MonthlyBankTotal[]> = {};
    
    months.forEach(month => {
      if (!grouped[month.year]) {
        grouped[month.year] = [];
      }
      grouped[month.year].push(month);
    });
    
    // Sort years in descending order
    return Object.entries(grouped)
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .map(([year, monthsInYear]) => ({
        year: Number(year),
        months: monthsInYear
      }));
  };

  const groupedByYear = groupMonthsByYear();

  return (
    <Box>
      {groupedByYear.map(yearGroup => (
        <Box key={yearGroup.year} sx={{ mb: 2 }}>
          {/* Year divider */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 0.5,
              mt: 1,
              position: 'relative'
            }}
          >
            <Box 
              sx={{ 
                width: '100%', 
                height: '1px', 
                bgcolor: theme.palette.divider 
              }} 
            />
            <Typography 
              variant="body2" 
              fontWeight="medium" 
              color="text.secondary"
              sx={{ 
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                px: 1.5,
                bgcolor: 'background.paper'
              }}
            >
              {yearGroup.year}
            </Typography>
          </Box>
          
          {/* Months for this year */}
          <List sx={{ 
            width: '100%',
            border: 'none',
            borderRadius: 0,
            overflow: 'hidden'
          }}>
            {yearGroup.months.map((month, index) => {
              const monthKey = `${month.year}-${month.month}`;
              const monthItems = Object.values(localItems).filter(item => {
                const date = new Date(item.Date);
                return date.getFullYear() === month.year && (date.getMonth() + 1) === Number(month.month);
              });
              
              const { income, expenses, balance } = calculateMonthStats(monthItems);
              
              return (
                <Paper 
                  key={monthKey} 
                  elevation={0} 
                  sx={{ 
                    mb: 0, 
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: index > 0 ? 'none' : `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden'
                  }}
                >
                  {/* Compact view */}
                  <ListItem 
                    onClick={() => handleExpand(monthKey)} 
                    sx={{ 
                      bgcolor: expandedMonth === monthKey ? 
                        `${theme.palette.primary.main}10` : 
                        'background.paper',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        bgcolor: expandedMonth === monthKey ? 
                          `${theme.palette.primary.main}15` : 
                          theme.palette.action.hover
                      },
                      py: 1,
                      px: 2
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      width: '100%', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {/* Month name */}
                      <Typography variant="body1" fontWeight="medium">
                        {formatCompactMonth(month.monthName, month.year, month.month)}
                      </Typography>
                      
                      {/* Compact financial data */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Income */}
                        <Box sx={{ width: '30%', textAlign: 'center' }}>
                          <Typography 
                            variant="body2" 
                            color={theme.palette.success.main}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ArrowUpwardIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                            {formatCurrency(income)}
                          </Typography>
                        </Box>
                        
                        {/* Expenses */}
                        <Box sx={{ width: '30%', textAlign: 'center' }}>
                          <Typography 
                            variant="body2" 
                            color={theme.palette.error.main}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ArrowDownwardIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                            {formatCurrency(expenses)}
                          </Typography>
                        </Box>
                        
                        {/* Balance */}
                        <Box sx={{ width: '30%', textAlign: 'center' }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            color={balance >= 0 ? theme.palette.success.main : theme.palette.error.main}
                          >
                            {formatCurrency(balance)}
                          </Typography>
                        </Box>
                        
                        {/* Expand button */}
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpand(monthKey);
                          }}
                        >
                          {expandedMonth === monthKey ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                  
                  <Collapse in={expandedMonth === monthKey} timeout="auto" unmountOnExit>
                    <Box 
                      sx={{ 
                        p: '5px', 
                        bgcolor: theme.palette.background.default,
                        borderTop: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      {monthItems.length === 0 ? (
                        <Typography color="text.secondary">No transactions for this month.</Typography>
                      ) : (
                        <>
                          {(() => {
                            // Group items by Description
                            const groupedItems: Record<string, BankItem[]> = {};
                            
                            monthItems.forEach(item => {
                              if (!groupedItems[item.Description]) {
                                groupedItems[item.Description] = [];
                              }
                              groupedItems[item.Description].push(item);
                            });
                            
                            // Calculate total for each group
                            const groupTotals = Object.entries(groupedItems).map(([name, items]) => {
                              const total = items.reduce((sum, item) => sum + item.Amount, 0);
                              return { 
                                name, 
                                items, 
                                total,
                                absTotal: Math.abs(total)
                              };
                            });
                            
                            // Sort by absolute value (highest first)
                            groupTotals.sort((a, b) => b.absTotal - a.absTotal);
                            
                            return (
                              <List dense>
                                {groupTotals.map(({ name, items, total }, groupIndex) => {
                                  const groupKey = `${monthKey}-${name}`;
                                  const isGroupExpanded = expandedGroups[groupKey] || false;
                                  
                                  return (
                                    <React.Fragment key={name}>
                                      {groupIndex > 0 && (
                                        <Divider sx={{ my: 1 }} />
                                      )}
                                      <Box sx={{ mb: 1 }}>
                                        <Box 
                                          sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 0.5,
                                            cursor: 'pointer',
                                            py: 0.5,
                                            px: 1,
                                            borderRadius: 1,
                                            '&:hover': {
                                              bgcolor: theme.palette.action.hover
                                            }
                                          }}
                                          onClick={() => handleGroupToggle(groupKey)}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <IconButton 
                                              size="small" 
                                              sx={{ mr: 1, p: 0 }}
                                            >
                                              {isGroupExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                            </IconButton>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                              {name}
                                            </Typography>
                                            {items.length > 1 && (
                                              <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                  bgcolor: theme.palette.action.selected,
                                                  borderRadius: '50%',
                                                  width: 20,
                                                  height: 20,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  ml: 1
                                                }}
                                              >
                                                {items.length}
                                              </Typography>
                                            )}
                                          </Box>
                                          <Typography 
                                            variant="body2" 
                                            fontWeight="medium"
                                            color={total >= 0 ? theme.palette.success.main : theme.palette.error.main}
                                          >
                                            {total >= 0 ? '+' : ''}{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </Typography>
                                        </Box>
                                        
                                        <Collapse in={isGroupExpanded} timeout="auto" unmountOnExit>
                                          <Box sx={{ pl: 2 }}>
                                            {items.map(item => (
                                              <ListItem 
                                                key={item.id} 
                                                onClick={() => handleItemClick(item)}
                                                sx={{ 
                                                  cursor: 'pointer',
                                                  py: 0.5,
                                                  px: 1,
                                                  borderRadius: 1,
                                                  '&:hover': {
                                                    bgcolor: theme.palette.action.hover
                                                  }
                                                }}
                                                dense
                                              >
                                                <Box sx={{ 
                                                  display: 'flex', 
                                                  width: '100%', 
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center'
                                                }}>
                                                  <Typography variant="body2" color="text.secondary">
                                                    {item.Date}
                                                  </Typography>
                                                  <Typography 
                                                    variant="body2" 
                                                    color={item.Amount >= 0 ? theme.palette.success.main : theme.palette.error.main}
                                                  >
                                                    {item.Amount >= 0 ? '+' : ''}{item.Amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                  </Typography>
                                                </Box>
                                              </ListItem>
                                            ))}
                                          </Box>
                                        </Collapse>
                                      </Box>
                                    </React.Fragment>
                                  );
                                })}
                              </List>
                            );
                          })()}
                        </>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </List>
        </Box>
      ))}
      <BankMonthDetailsDialog 
        open={detailsDialogOpen} 
        item={selectedItem} 
        onClose={handleDialogClose}
        onEdit={handleEditClick}
      />
      <BankItemEditDialog
        open={editDialogOpen}
        bankItem={selectedItem}
        onClose={handleEditDialogClose}
        onSave={handleSaveItem}
      />
    </Box>
  );
};
