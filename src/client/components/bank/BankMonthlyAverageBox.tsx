import React from 'react';
import { Box, Typography, Stack, useTheme, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BalanceIcon from '@mui/icons-material/Balance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
        Monthly Averages (By Year)
      </Typography>
      
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
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                <CalendarMonthIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Monthly Averages
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
              {/* Monthly Average Income */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <ArrowUpwardIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Avg. Monthly Income
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color={theme.palette.success.main}>
                  {formatCurrency(data.monthlyAvg.income)}/month
                </Typography>
              </Box>
              
              {/* Monthly Average Outcome */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <ArrowDownwardIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Avg. Monthly Expenses
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold" color={theme.palette.error.main}>
                  {formatCurrency(data.monthlyAvg.outcome)}/month
                </Typography>
              </Box>
              
              {/* Monthly Average Difference */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <BalanceIcon sx={{ color: theme.palette.text.primary, mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Avg. Monthly Balance
                  </Typography>
                </Box>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  color={data.monthlyAvg.difference >= 0 ? theme.palette.success.main : theme.palette.error.main}
                >
                  {formatCurrency(data.monthlyAvg.difference)}/month
                </Typography>
              </Box>
            </Stack>
            
            <Box mt={3} mb={1}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Yearly Totals
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {/* Yearly Income */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <ArrowUpwardIcon sx={{ color: theme.palette.success.main, opacity: 0.7, mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ opacity: 0.7 }}>
                    Total Income
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" color={theme.palette.success.main} sx={{ opacity: 0.7 }}>
                  {formatCurrency(data.income)}
                </Typography>
              </Box>
              
              {/* Yearly Outcome */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <ArrowDownwardIcon sx={{ color: theme.palette.error.main, opacity: 0.7, mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ opacity: 0.7 }}>
                    Total Expenses
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" color={theme.palette.error.main} sx={{ opacity: 0.7 }}>
                  {formatCurrency(data.outcome)}
                </Typography>
              </Box>
              
              {/* Yearly Difference */}
              <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <BalanceIcon sx={{ color: theme.palette.text.primary, opacity: 0.7, mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ opacity: 0.7 }}>
                    Total Balance
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  fontWeight="medium" 
                  color={data.difference >= 0 ? theme.palette.success.main : theme.palette.error.main}
                  sx={{ opacity: 0.7 }}
                >
                  {formatCurrency(data.difference)}
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
