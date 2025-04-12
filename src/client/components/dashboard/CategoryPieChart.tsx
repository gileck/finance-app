import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Stack
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
} from 'recharts';
import { CardItem } from '@/apis/cardItems/types';
import { DashboardCard } from './DashboardCard';
import PieChartIcon from '@mui/icons-material/PieChart';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';

interface CategoryPieChartProps {
  items: CardItem[];
  loading: boolean;
}

interface CategoryTotal {
  name: string;
  value: number;
  percentage: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryTotal;
  }>;
}

interface LegendProps {
  payload: Array<{
    value: string;
    color: string;
    percentage: number;
    amount: number;
    currency: string;
  }>;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          p: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {data.name}
        </Typography>
        <Typography variant="body2">
          {formatCurrency(data.value, 'NIS')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.percentage.toFixed(1)}% of total
        </Typography>
      </Box>
    );
  }
  return null;
};

// Custom legend that shows top categories only
const CustomLegend = ({ payload }: LegendProps) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 0.5, 
      width: '100%',
      maxHeight: '300px',
      overflowY: 'auto',
      pr: 1,
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: alpha(theme.palette.primary.main, 0.05),
      },
      '&::-webkit-scrollbar-thumb': {
        background: alpha(theme.palette.primary.main, 0.2),
        borderRadius: '4px',
      },
    }}>
      {payload.map((entry) => (
        <Box 
          key={`legend-${entry.value}`} 
          display="flex" 
          alignItems="center"
          sx={{
            p: 0.5,
            borderRadius: 1,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: alpha(entry.color, 0.1),
              transform: 'translateX(2px)'
            }
          }}
        >
          <Box
            sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(entry.color, 0.1),
              color: entry.color,
              mr: 1,
              flexShrink: 0
            }}
          >
            {getCategoryIcon(entry.value)}
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              flexGrow: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {entry.value}
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="flex-end">
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 'medium',
                color: theme.palette.text.primary,
                whiteSpace: 'nowrap'
              }}
            >
              {formatCurrency(entry.amount, entry.currency)}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                whiteSpace: 'nowrap'
              }}
            >
              {entry.percentage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  items,
  loading
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
          value: 0,
          percentage: 0
        };
      }
      
      categories[Category].value += Amount;
      grandTotal += Amount;
    });
    
    // Second pass: calculate percentages
    if (grandTotal > 0) {
      Object.values(categories).forEach(category => {
        category.percentage = (category.value / grandTotal) * 100;
      });
    }
    
    // Sort by value (descending)
    return Object.values(categories)
      .sort((a, b) => b.value - a.value);
  };

  const categoryTotals = calculateCategoryTotals();
  const currency = items.length > 0 ? items[0].Currency : 'NIS';

  if (loading) {
    return (
      <DashboardCard 
        title="Categories Breakdown" 
        icon={<PieChartIcon />}
        color="secondary"
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
        title="Categories Breakdown" 
        icon={<PieChartIcon />}
        color="secondary"
      >
        <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      </DashboardCard>
    );
  }

  // For the legend, show only top categories if there are too many
  const legendItems = categoryTotals.slice(0, 15);

  return (
    <DashboardCard 
      title="Categories Breakdown" 
      icon={<PieChartIcon />}
      color="secondary"
      height={isMobile ? 'auto' : 380}
    >
      <Box 
        sx={{
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.light, 0.2)} 0%, transparent 70%)`,
            zIndex: 0
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.15)} 0%, transparent 70%)`,
            zIndex: 0
          }
        }}
      >
        {/* For mobile, stack chart and legend vertically */}
        {isMobile ? (
          <Stack spacing={2} sx={{ width: '100%' }}>
            {/* Chart */}
            <Box 
              height={200} 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              sx={{ zIndex: 1 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke={theme.palette.background.paper}
                  >
                    {categoryTotals.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={getCategoryColor(entry.name, theme)} 
                        style={{
                          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            
            {/* Legend */}
            <Box 
              display="flex" 
              alignItems="flex-start" 
              justifyContent="flex-start"
              sx={{ zIndex: 1 }}
            >
              <CustomLegend 
                payload={legendItems.map((item) => ({
                  value: item.name,
                  color: getCategoryColor(item.name, theme),
                  percentage: item.percentage,
                  amount: item.value,
                  currency
                }))} 
              />
            </Box>
          </Stack>
        ) : (
          // For desktop, use side-by-side layout
          <Box display="flex" flexDirection="row" height="100%">
            {/* Chart */}
            <Box 
              width="50%" 
              height="100%" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              sx={{ zIndex: 1 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke={theme.palette.background.paper}
                  >
                    {categoryTotals.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={getCategoryColor(entry.name, theme)} 
                        style={{
                          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            
            {/* Legend */}
            <Box 
              width="50%" 
              display="flex" 
              alignItems="flex-start" 
              justifyContent="flex-start"
              height="100%"
              sx={{ zIndex: 1 }}
            >
              <CustomLegend 
                payload={legendItems.map((item) => ({
                  value: item.name,
                  color: getCategoryColor(item.name, theme),
                  percentage: item.percentage,
                  amount: item.value,
                  currency
                }))} 
              />
            </Box>
          </Box>
        )}
      </Box>
    </DashboardCard>
  );
};
