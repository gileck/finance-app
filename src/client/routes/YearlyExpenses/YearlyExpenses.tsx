import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Divider,
    alpha,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { getCardItems } from '@/apis/cardItems/client';
import type { CardItem } from '@/apis/cardItems/types';
import { getBankItems } from '@/apis/bankItems/client';
import type { BankItem } from '@/apis/bankItems/types';
import { convertToNis, formatNis } from '@/common/currency';
import { CategoryPieChart } from '@/client/components/dashboard/CategoryPieChart';
import { getCategoryIcon, getCategoryColor } from '@/client/utils/categoryUtils';
import { BudgetUtilizationBar } from './BudgetUtilizationBar';
import { InvestmentSettingsDialog } from './InvestmentSettingsDialog';
import { getInvestmentSettings, type InvestmentSettings } from '@/client/utils/investmentStorage';
import {
    getYearlyExpensesPreferences,
    saveYearlyExpensesPreferences,
    type ViewMode,
    type PeriodMode
} from '@/client/utils/yearlyExpensesStorage';

type CategoryYearAgg = {
    category: string;
    totalNis: number;
    monthTotals: number[];
};

const getYearDateRange = (year: number) => ({
    startDate: new Date(year, 0, 1).toISOString().split('T')[0],
    endDate: new Date(year, 11, 31).toISOString().split('T')[0]
});

const getLast12MonthsDateRange = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
    };
};

export const YearlyExpenses: React.FC = () => {
    const theme = useTheme();
    const currentYear = new Date().getFullYear();

    // Load preferences from localStorage
    const savedPreferences = getYearlyExpensesPreferences(currentYear);

    const [year, setYear] = useState<number>(savedPreferences.year);
    const [period, setPeriod] = useState<PeriodMode>(savedPreferences.period);
    const [view, setView] = useState<ViewMode>(savedPreferences.view);
    const [showRemaining, setShowRemaining] = useState<boolean>(savedPreferences.showRemaining);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [cardItems, setCardItems] = useState<CardItem[]>([]);
    const [bankYearItems, setBankYearItems] = useState<BankItem[]>([]);
    const [investmentSettings, setInvestmentSettings] = useState<InvestmentSettings>(() => getInvestmentSettings());
    const [investmentDialogOpen, setInvestmentDialogOpen] = useState<boolean>(false);
    const [yearDialogOpen, setYearDialogOpen] = useState<boolean>(false);

    // Save preferences whenever they change
    useEffect(() => {
        saveYearlyExpensesPreferences({ year, period, view, showRemaining });
    }, [year, period, view, showRemaining]);

    const fetchYear = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = period === 'year' ? getYearDateRange(year) : getLast12MonthsDateRange();
            const [cardResp, bankResp] = await Promise.all([
                getCardItems({ filter: { startDate, endDate } }),
                getBankItems({ filter: { startDate, endDate } })
            ]);

            if (cardResp.data.error) {
                setError(cardResp.data.error);
                setCardItems([]);
            } else {
                setCardItems(Object.values(cardResp.data.cardItems || {}));
            }

            if (bankResp.data.error) {
                setError(prev => prev ?? (bankResp.data.error!));
                setBankYearItems([]);
            } else {
                const allBank = Object.values(bankResp.data.bankItems || {});
                setBankYearItems(allBank);
            }
        } catch (e) {
            setError(`Failed to load year data: ${e instanceof Error ? e.message : String(e)}`);
            setCardItems([]);
            setBankYearItems([]);
        } finally {
            setLoading(false);
        }
    }, [year, period]);

    useEffect(() => {
        fetchYear();
    }, [fetchYear]);

    const combinedItems: CardItem[] = useMemo(() => {
        const bankExpenseItems = bankYearItems.filter(b => b.Amount < 0 && (b.Category || '').toLowerCase() !== 'credit card');
        const mappedBank: CardItem[] = bankExpenseItems.map(b => ({
            id: `bank-${b.id}`,
            Date: b.Date,
            Name: b.Description,
            DisplayName: b.Description,
            Amount: Math.abs(b.Amount),
            Category: b.Category || 'Uncategorized',
            Currency: 'NIS',
            Card: false
        } as CardItem));
        return [...cardItems, ...mappedBank];
    }, [cardItems, bankYearItems]);

    const aggregates: CategoryYearAgg[] = useMemo(() => {
        const byCategory: Record<string, CategoryYearAgg> = {};
        for (const item of combinedItems) {
            const category = item.Category || 'Uncategorized';
            if (!byCategory[category]) {
                byCategory[category] = { category, totalNis: 0, monthTotals: Array(12).fill(0) };
            }
            const d = new Date(item.Date);
            const m = d.getMonth();
            const nis = convertToNis(item.Amount, item.Currency);
            byCategory[category].totalNis += nis;
            byCategory[category].monthTotals[m] += nis;
        }
        return Object.values(byCategory).sort((a, b) => b.totalNis - a.totalNis);
    }, [combinedItems]);

    // Bank-only totals for budget status card
    const totalIncome = useMemo(() => {
        return bankYearItems.filter(b => b.Amount >= 0).reduce((sum, b) => sum + b.Amount, 0);
    }, [bankYearItems]);

    const bankExpensesTotal = useMemo(() => {
        // ALL negative amounts (including credit card payments)
        return bankYearItems
            .filter(b => b.Amount < 0)
            .reduce((sum, b) => sum + Math.abs(b.Amount), 0);
    }, [bankYearItems]);

    const monthsActive = useMemo(() => {
        if (period === 'last12') return 12;
        return year === currentYear ? new Date().getMonth() + 1 : 12;
    }, [year, currentYear, period]);

    const investmentAmount = useMemo(() => {
        if (!investmentSettings.enabled) return 0;

        let monthlyInvestment = 0;
        if (investmentSettings.type === 'amount') {
            monthlyInvestment = investmentSettings.monthlyAmount;
        } else {
            // Calculate percentage of monthly income
            const monthlyIncome = monthsActive > 0 ? totalIncome / monthsActive : 0;
            monthlyInvestment = (monthlyIncome * investmentSettings.percentage) / 100;
        }

        return view === 'total' ? monthlyInvestment * monthsActive : monthlyInvestment;
    }, [investmentSettings, view, monthsActive, totalIncome]);

    // For budget status card - use bank expenses only
    const incomeForView = useMemo(() => (view === 'total' ? totalIncome : (monthsActive > 0 ? totalIncome / monthsActive : 0)), [totalIncome, view, monthsActive]);
    const bankExpensesForView = useMemo(() => (view === 'total' ? bankExpensesTotal : (monthsActive > 0 ? bankExpensesTotal / monthsActive : 0)), [bankExpensesTotal, view, monthsActive]);
    const totalExpensesWithInvestment = bankExpensesForView + investmentAmount;
    const usedPercent = incomeForView > 0 ? Math.min(100, (totalExpensesWithInvestment / incomeForView) * 100) : 0;

    const handleViewChange = (_: unknown, next: ViewMode | null) => {
        if (next) setView(next);
    };

    const chartItems: CardItem[] = useMemo(() => {
        const baseItems = view === 'total'
            ? combinedItems
            : combinedItems.map(i => {
                const factor = monthsActive > 0 ? 1 / monthsActive : 1;
                return { ...i, Amount: i.Amount * factor };
            });

        // Add investment as a synthetic item if enabled
        if (investmentSettings.enabled && investmentAmount > 0) {
            const investmentItem: CardItem = {
                id: 'investment-synthetic',
                Date: new Date().toISOString().split('T')[0],
                Name: 'Investment',
                DisplayName: 'Investment',
                Amount: investmentAmount,
                Category: 'Investment',
                Currency: 'NIS',
                Card: false
            };
            return [...baseItems, investmentItem];
        }

        return baseItems;
    }, [combinedItems, view, monthsActive, investmentSettings, investmentAmount]);


    return (
        <Container maxWidth="lg" sx={{ pb: 4 }}>
            {/* Modern Pill-Style Controls */}
            <Box
                sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}
            >
                {/* Year Selector - Centered Button */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <Box
                        onClick={() => setYearDialogOpen(true)}
                        sx={{
                            px: 4,
                            py: 2,
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                            },
                            '&:active': {
                                transform: 'translateY(0)'
                            }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <CalendarMonthIcon
                                sx={{
                                    fontSize: 28,
                                    color: '#fff'
                                }}
                            />
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 600,
                                        color: alpha('#fff', 0.9),
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {period === 'last12' ? 'Last 12 Months' : 'Year'}
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#fff'
                                    }}
                                >
                                    {period === 'last12' ? 'Rolling' : year}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* View Toggle - Compact Segmented Control */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignSelf: 'center',
                        p: 0.5,
                        borderRadius: 20,
                        background: alpha(theme.palette.background.paper, 0.8),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`
                    }}
                >
                    <Box
                        onClick={() => handleViewChange(null, 'total')}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 18,
                            background: view === 'total'
                                ? theme.palette.primary.main
                                : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                background: view === 'total'
                                    ? theme.palette.primary.dark
                                    : alpha(theme.palette.primary.main, 0.08)
                            }
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: view === 'total' ? '#fff' : theme.palette.text.secondary,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            💰 Total
                        </Typography>
                    </Box>
                    <Box
                        onClick={() => handleViewChange(null, 'average')}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 18,
                            background: view === 'average'
                                ? theme.palette.primary.main
                                : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                background: view === 'average'
                                    ? theme.palette.primary.dark
                                    : alpha(theme.palette.primary.main, 0.08)
                            }
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: view === 'average' ? '#fff' : theme.palette.text.secondary,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            📊 Per Month
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={12}>
                    <CircularProgress size={48} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ my: 3, borderRadius: 3 }}>{error}</Alert>
            ) : (
                <>
                    <BudgetUtilizationBar
                        income={incomeForView}
                        expenses={bankExpensesForView}
                        usedPercent={usedPercent}
                        investmentAmount={investmentAmount}
                        onInvestmentSettingsClick={() => setInvestmentDialogOpen(true)}
                    />

                    <Box mb={3}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Categories Breakdown
                            </Typography>

                            {/* Modern Toggle for Remaining Budget */}
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    p: 0.5,
                                    borderRadius: 20,
                                    background: alpha(theme.palette.background.paper, 0.8),
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`
                                }}
                            >
                                <Box
                                    onClick={() => setShowRemaining(false)}
                                    sx={{
                                        px: 2.5,
                                        py: 0.75,
                                        borderRadius: 18,
                                        background: !showRemaining
                                            ? theme.palette.primary.main
                                            : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: !showRemaining
                                                ? theme.palette.primary.dark
                                                : alpha(theme.palette.primary.main, 0.08)
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '0.8125rem',
                                            color: !showRemaining ? '#fff' : theme.palette.text.secondary,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Expenses
                                    </Typography>
                                </Box>
                                <Box
                                    onClick={() => setShowRemaining(true)}
                                    sx={{
                                        px: 2.5,
                                        py: 0.75,
                                        borderRadius: 18,
                                        background: showRemaining
                                            ? theme.palette.primary.main
                                            : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            background: showRemaining
                                                ? theme.palette.primary.dark
                                                : alpha(theme.palette.primary.main, 0.08)
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '0.8125rem',
                                            color: showRemaining ? '#fff' : theme.palette.text.secondary,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        + Balance
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <CategoryPieChart
                            items={chartItems}
                            loading={false}
                            totalBudgetNis={incomeForView}
                            size="large"
                            includeRemaining={showRemaining}
                        />
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Monthly Breakdown
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ overflowX: 'auto' }}>
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                                <Box component="thead">
                                    <Box component="tr">
                                        <Box component="th" sx={{ textAlign: 'left', p: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                                            Category
                                        </Box>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <Box key={i} component="th" sx={{ textAlign: 'right', p: 1.5, fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
                                                {new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}
                                            </Box>
                                        ))}
                                        <Box component="th" sx={{ textAlign: 'right', p: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                                            Total
                                        </Box>
                                        <Box component="th" sx={{ textAlign: 'right', p: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                                            %
                                        </Box>
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {aggregates.map((row) => {
                                        const denominator = incomeForView > 0 ? incomeForView : 0;
                                        const rowTotalForView = view === 'total' ? row.totalNis : (monthsActive > 0 ? row.totalNis / monthsActive : 0);
                                        const percentage = denominator > 0 ? (rowTotalForView / denominator) * 100 : 0;
                                        return (
                                            <Box
                                                key={row.category}
                                                component="tr"
                                                sx={{
                                                    '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                                                    transition: 'background-color 0.2s',
                                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
                                                }}
                                            >
                                                <Box component="td" sx={{ p: 1.5, minWidth: 180 }}>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <Box
                                                            sx={{
                                                                color: getCategoryColor(row.category),
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            {getCategoryIcon(row.category)}
                                                        </Box>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {row.category}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {row.monthTotals.map((val, idx) => (
                                                    <Box
                                                        key={idx}
                                                        component="td"
                                                        sx={{
                                                            p: 1.5,
                                                            textAlign: 'right',
                                                            fontSize: '0.875rem',
                                                            color: val > 0 ? 'text.primary' : 'text.disabled'
                                                        }}
                                                    >
                                                        {val > 0 ? formatNis(val) : '—'}
                                                    </Box>
                                                ))}
                                                <Box component="td" sx={{ p: 1.5, textAlign: 'right', fontWeight: 600 }}>
                                                    {formatNis(rowTotalForView)}
                                                </Box>
                                                <Box component="td" sx={{ p: 1.5, textAlign: 'right', fontWeight: 600, color: 'primary.main' }}>
                                                    {percentage.toFixed(1)}%
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </>
            )}

            {/* Year Selection Dialog */}
            <Dialog
                open={yearDialogOpen}
                onClose={() => setYearDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Select Period
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <List sx={{ pt: 0 }}>
                        {/* Last 12 Months Option */}
                        <ListItem disablePadding>
                            <ListItemButton
                                selected={period === 'last12'}
                                onClick={() => {
                                    setPeriod('last12');
                                    setYearDialogOpen(false);
                                }}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    '&.Mui-selected': {
                                        backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.secondary.main, 0.2)
                                        }
                                    }
                                }}
                            >
                                <ListItemText
                                    primary="Last 12 Months"
                                    secondary="Rolling 12-month period"
                                    primaryTypographyProps={{
                                        fontWeight: period === 'last12' ? 700 : 500,
                                        color: period === 'last12' ? 'secondary' : 'text.primary'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>

                        {/* Divider */}
                        <Divider sx={{ my: 1 }} />

                        {/* Year Options */}
                        {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4].map((y) => (
                            <ListItem key={y} disablePadding>
                                <ListItemButton
                                    selected={period === 'year' && year === y}
                                    onClick={() => {
                                        setPeriod('year');
                                        setYear(y);
                                        setYearDialogOpen(false);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        '&.Mui-selected': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.2)
                                            }
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={y}
                                        primaryTypographyProps={{
                                            fontWeight: (period === 'year' && year === y) ? 700 : 500,
                                            color: (period === 'year' && year === y) ? 'primary' : 'text.primary'
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            <InvestmentSettingsDialog
                open={investmentDialogOpen}
                onClose={() => setInvestmentDialogOpen(false)}
                onSave={(settings) => setInvestmentSettings(settings)}
            />
        </Container>
    );
};

export default YearlyExpenses;
