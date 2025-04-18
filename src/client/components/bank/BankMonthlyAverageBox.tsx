import React from 'react';
import { Box, Typography, useTheme, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BalanceIcon from '@mui/icons-material/Balance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { BankItem } from '@/apis/bankItems/types';

interface BankMonthlyAverageBoxProps {
  items: Record<string, BankItem>;
  loading: boolean;
}

interface YearlyData {
  year: number;
  income: number;
  outcome: number;
  difference: number;
  monthCount: number;
  monthlyAvg: {
    income: number;
    outcome: number;
    difference: number;
  };
}

export const BankMonthlyAverageBox: React.FC<BankMonthlyAverageBoxProps> = ({ items, loading }) => {
  const theme = useTheme();

  // Calculate yearly data with monthly averages
  const calculateYearlyData = (): YearlyData[] => {
    const allItems = Object.values(items);
    
    // Group items by year and month
    const yearMonthData: Record<number, Record<string, { income: number; outcome: number }>> = {};
    
    allItems.forEach(item => {
      const date = new Date(item.Date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      
      if (!yearMonthData[year]) {
        yearMonthData[year] = {};
      }
      
      if (!yearMonthData[year][month]) {
        yearMonthData[year][month] = { income: 0, outcome: 0 };
      }
      
      if (item.Amount > 0) {
        yearMonthData[year][month].income += item.Amount;
      } else {
        yearMonthData[year][month].outcome += Math.abs(item.Amount);
      }
    });
    
    // Calculate yearly totals and monthly averages
    const yearlyData = Object.entries(yearMonthData).map(([yearStr, monthsData]) => {
      const year = parseInt(yearStr);
      const monthCount = Object.keys(monthsData).length;
      
      // Calculate yearly totals
      let totalIncome = 0;
      let totalOutcome = 0;
      
      Object.values(monthsData).forEach(monthData => {
        totalIncome += monthData.income;
        totalOutcome += monthData.outcome;
      });
      
      const totalDifference = totalIncome - totalOutcome;
      
      // Calculate monthly averages
      const monthlyAvgIncome = totalIncome / monthCount;
      const monthlyAvgOutcome = totalOutcome / monthCount;
      const monthlyAvgDifference = totalDifference / monthCount;
      
      return {
        year,
        income: totalIncome,
        outcome: totalOutcome,
        difference: totalDifference,
        monthCount,
        monthlyAvg: {
          income: monthlyAvgIncome,
          outcome: monthlyAvgOutcome,
          difference: monthlyAvgDifference
        }
      };
    });
    
    // Sort by year (descending)
    return yearlyData.sort((a, b) => b.year - a.year);
  };

  const formatCurrency = (amount: number): string => {
    return `₪${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const yearlyData = calculateYearlyData();

  if (loading || yearlyData.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      
      
      {yearlyData.map((data) => (
        <Accordion key={data.year} sx={{ mb: 1 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              color: 'white',
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'white'
              }
            }}
          >
            <Box display="flex" alignItems="center" width="100%" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Typography variant="h6" mr={1}>{data.year}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  ({data.monthCount} {data.monthCount === 1 ? 'month' : 'months'})
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                color={data.monthlyAvg.difference >= 0 ? theme.palette.success.light : theme.palette.error.light}
              >
                {formatCurrency(data.monthlyAvg.difference)}/month
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {/* Monthly Averages - Combined into one line */}
            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1.5}>
                <CalendarMonthIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                  Monthly Averages
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  {/* Income */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: theme.palette.success.light + '08',
                    }}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <ArrowUpwardIcon sx={{ color: theme.palette.success.main, fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          Income
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold" color={theme.palette.success.main}>
                        {formatCurrency(data.monthlyAvg.income)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Expenses */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: theme.palette.error.light + '08',
                    }}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <ArrowDownwardIcon sx={{ color: theme.palette.error.main, fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          Expenses
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold" color={theme.palette.error.main}>
                        {formatCurrency(data.monthlyAvg.outcome)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Balance */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: data.monthlyAvg.difference >= 0 
                        ? theme.palette.success.light + '08' 
                        : theme.palette.error.light + '08',
                    }}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <BalanceIcon sx={{ 
                          color: data.monthlyAvg.difference >= 0 
                            ? theme.palette.success.main 
                            : theme.palette.error.main, 
                          fontSize: '1rem', 
                          mr: 0.5 
                        }} />
                        <Typography variant="body2" fontWeight="medium">
                          Balance
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold" 
                        color={data.monthlyAvg.difference >= 0 ? theme.palette.success.main : theme.palette.error.main}
                      >
                        {formatCurrency(data.monthlyAvg.difference)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Yearly Totals - Combined into one line */}
            <Box>
              <Box display="flex" alignItems="center" mb={1.5}>
                <DateRangeIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                  Yearly Totals
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  {/* Income */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: theme.palette.success.light + '08',
                    }}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <ArrowUpwardIcon sx={{ color: theme.palette.success.main, fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          Income
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold" color={theme.palette.success.main}>
                        {formatCurrency(data.income)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Expenses */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: theme.palette.error.light + '08',
                    }}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <ArrowDownwardIcon sx={{ color: theme.palette.error.main, fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2" fontWeight="medium">
                          Expenses
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold" color={theme.palette.error.main}>
                        {formatCurrency(data.outcome)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Balance */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: data.difference >= 0 
                        ? theme.palette.success.light + '08' 
                        : theme.palette.error.light + '08',
                    }}>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <BalanceIcon sx={{ 
                          color: data.difference >= 0 
                            ? theme.palette.success.main 
                            : theme.palette.error.main, 
                          fontSize: '1rem', 
                          mr: 0.5 
                        }} />
                        <Typography variant="body2" fontWeight="medium">
                          Balance
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold" 
                        color={data.difference >= 0 ? theme.palette.success.main : theme.palette.error.main}
                      >
                        {formatCurrency(data.difference)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
