import React, { useState } from 'react';
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
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';
import { convertToNis } from '@/common/currency';
import { CategoryItemsDialog } from './CategoryItemsDialog';

interface CategoryPieChartProps {
  items: CardItem[];
  loading: boolean;
  totalBudgetNis?: number;
  size?: 'normal' | 'large';
  includeRemaining?: boolean;
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
const CustomLegend = ({ payload, onCategoryClick }: LegendProps & { onCategoryClick: (category: string) => void }) => {
  const theme = useTheme();

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      width: '100%',
      pr: 1
    }}>
      {payload.map((entry, index) => (
        <Box
          key={`item-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            transition: 'all 0.2s',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05)
            }
          }}
          onClick={() => onCategoryClick(entry.value)}
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
              flexGrow: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500
            }}
          >
            {entry.value}
          </Typography>
          <Box display="flex" flexDirection="column" alignItems="flex-end">
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                whiteSpace: 'nowrap'
              }}
            >
              {formatCurrency(entry.amount, entry.currency)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
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
  loading,
  totalBudgetNis,
  size = 'normal',
  includeRemaining = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate totals by category
  const calculateCategoryTotals = (): CategoryTotal[] => {
    const categories: Record<string, CategoryTotal> = {};
    let grandTotal = 0;

    // First pass: calculate totals per category and grand total
    items.forEach(item => {
      const { Category, Amount, Currency } = item;

      if (!categories[Category]) {
        categories[Category] = {
          name: Category,
          value: 0,
          percentage: 0
        };
      }

      const nisAmount = convertToNis(Amount, Currency);
      categories[Category].value += nisAmount;
      grandTotal += nisAmount;
    });

    // Determine denominator: total budget if provided, else sum of expenses
    const denominator = totalBudgetNis && totalBudgetNis > 0 ? totalBudgetNis : grandTotal;

    // Prepare array and compute percentages
    const result: CategoryTotal[] = Object.values(categories).sort((a, b) => b.value - a.value);
    if (denominator > 0) {
      result.forEach(category => {
        category.percentage = (category.value / denominator) * 100;
      });
    }

    // If budget is provided, add a remaining balance slice to complete the 100%
    if (includeRemaining && totalBudgetNis && totalBudgetNis > 0) {
      const spent = grandTotal;
      const remaining = Math.max(totalBudgetNis - spent, 0);
      if (remaining > 0) {
        result.push({
          name: 'Remaining Budget',
          value: remaining,
          percentage: (remaining / denominator) * 100
        });
      }
    }

    return result;
  };

  const categoryTotals = calculateCategoryTotals();
  const currency = 'NIS';

  // Derive totals for center label and top summary
  const spentTotalNis = categoryTotals
    .filter(c => c.name !== 'Remaining Budget')
    .reduce((sum, c) => sum + c.value, 0);
  const denominator = totalBudgetNis && totalBudgetNis > 0 ? totalBudgetNis : spentTotalNis;
  const percentUsed = denominator > 0 ? (spentTotalNis / denominator) * 100 : 0;
  const top3 = categoryTotals.filter(c => c.name !== 'Remaining Budget').slice(0, 3);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (categoryTotals.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
        <Typography variant="body1" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // For the legend, show only top categories if there are too many
  const legendItems = categoryTotals.slice(0, 15);

  const colorFor = (name: string) => {
    if (name === 'Remaining Budget') {
      return theme.palette.grey[400];
    }
    return getCategoryColor(name, theme);
  };

  return (
    <Box>
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
              height={size === 'large' ? 600 : 300}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ zIndex: 1, position: 'relative' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={size === 'large' ? 120 : 60}
                    outerRadius={size === 'large' ? 220 : 120}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke={theme.palette.background.paper}
                    onClick={(data) => setSelectedCategory(data.name)}
                  >
                    {categoryTotals.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={colorFor(entry.name)}
                        style={{
                          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" color="text.secondary">Expenses</Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatCurrency(spentTotalNis, 'NIS')}
                </Typography>
                {totalBudgetNis ? (
                  <Typography variant="caption" color="text.secondary">{percentUsed.toFixed(0)}% of budget</Typography>
                ) : null}
              </Box>
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
                  color: colorFor(item.name),
                  percentage: item.percentage,
                  amount: item.value,
                  currency
                }))}
                onCategoryClick={setSelectedCategory}
              />
            </Box>
          </Stack>
        ) : (
          // For desktop, use side-by-side layout
          <Box display="flex" flexDirection="row" minHeight={size === 'large' ? 700 : 400}>
            {/* Chart */}
            <Box
              width="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ zIndex: 1, position: 'relative' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={size === 'large' ? 150 : 80}
                    outerRadius={size === 'large' ? 280 : 140}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke={theme.palette.background.paper}
                    onClick={(data) => setSelectedCategory(data.name)}
                  >
                    {categoryTotals.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={colorFor(entry.name)}
                        style={{
                          filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" color="text.secondary">Expenses</Typography>
                <Typography variant="h6" fontWeight={800}>
                  {formatCurrency(spentTotalNis, 'NIS')}
                </Typography>
                {totalBudgetNis ? (
                  <Typography variant="caption" color="text.secondary">{percentUsed.toFixed(0)}% of budget</Typography>
                ) : null}
              </Box>
            </Box>

            {/* Legend */}
            <Box
              width="50%"
              display="flex"
              alignItems="flex-start"
              justifyContent="flex-start"
              sx={{ zIndex: 1 }}
            >
              {/* Top 3 summary */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Top: {top3.map((t) => `${t.name}: ${t.percentage.toFixed(1)}%`).join(' • ')}
                </Typography>
              </Box>

              <CustomLegend
                payload={legendItems.map((item) => ({
                  value: item.name,
                  color: colorFor(item.name),
                  percentage: item.percentage,
                  amount: item.value,
                  currency
                }))}
                onCategoryClick={setSelectedCategory}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Category Items Dialog */}
      {selectedCategory && (
        <CategoryItemsDialog
          open={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          items={items.filter(item => item.Category === selectedCategory)}
        />
      )}
    </Box>
  );
};
