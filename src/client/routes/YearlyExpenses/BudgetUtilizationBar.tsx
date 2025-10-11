import React from 'react';
import { Box, Paper, Typography, LinearProgress, alpha, useTheme, IconButton, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { formatNis } from '@/common/currency';

interface BudgetUtilizationBarProps {
    income: number;
    expenses: number;
    usedPercent: number;
    investmentAmount?: number;
    onInvestmentSettingsClick?: () => void;
}

export const BudgetUtilizationBar: React.FC<BudgetUtilizationBarProps> = ({
    income,
    expenses,
    usedPercent,
    investmentAmount = 0,
    onInvestmentSettingsClick
}) => {
    const theme = useTheme();

    const totalExpensesWithInvestment = expenses + investmentAmount;
    const remaining = income - totalExpensesWithInvestment;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 4,
                background: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                position: 'relative'
            }}
        >
            {/* Investment Settings Button */}
            {onInvestmentSettingsClick && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12
                    }}
                >
                    <Tooltip title="Investment Settings">
                        <IconButton
                            size="small"
                            onClick={onInvestmentSettingsClick}
                            sx={{
                                color: theme.palette.primary.main,
                                background: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': {
                                    background: alpha(theme.palette.primary.main, 0.2)
                                }
                            }}
                        >
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* Values Row - Top 3 */}
            <Box
                display="grid"
                gridTemplateColumns="repeat(3, 1fr)"
                gap={2}
                mb={2}
            >
                {/* Spent */}
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            mb: 0.5,
                            fontWeight: 500
                        }}
                    >
                        Spent
                    </Typography>
                    <Box display="flex" alignItems="baseline" gap={0.75}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.error.main,
                                fontSize: '1.5rem'
                            }}
                        >
                            {formatNis(expenses)}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}
                        >
                            {income > 0 ? `${((expenses / income) * 100).toFixed(0)}%` : '—'}
                        </Typography>
                    </Box>
                </Box>

                {/* Investment */}
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            mb: 0.5,
                            fontWeight: 500
                        }}
                    >
                        Investment
                    </Typography>
                    <Box display="flex" alignItems="baseline" gap={0.75}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                fontSize: '1.5rem'
                            }}
                        >
                            {investmentAmount > 0 ? formatNis(investmentAmount) : '—'}
                        </Typography>
                        {investmentAmount > 0 && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}
                            >
                                {income > 0 ? `${((investmentAmount / income) * 100).toFixed(0)}%` : '—'}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Budget */}
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                            mb: 0.5,
                            fontWeight: 500
                        }}
                    >
                        Budget
                    </Typography>
                    <Box display="flex" alignItems="baseline" gap={0.75}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                fontSize: '1.5rem'
                            }}
                        >
                            {formatNis(income)}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}
                        >
                            100%
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Free Budget - Centered, Prominent */}
            <Box
                sx={{
                    textAlign: 'center',
                    mb: 2,
                    p: 2,
                    borderRadius: 3,
                    background: remaining >= 0
                        ? alpha(theme.palette.success.main, 0.08)
                        : alpha(theme.palette.error.main, 0.08),
                    border: `1px solid ${remaining >= 0
                        ? alpha(theme.palette.success.main, 0.2)
                        : alpha(theme.palette.error.main, 0.2)}`
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        mb: 0.5
                    }}
                >
                    Free Budget
                </Typography>
                <Box display="flex" alignItems="baseline" justifyContent="center" gap={1}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: remaining >= 0 ? theme.palette.success.main : theme.palette.error.main,
                            fontSize: '2rem'
                        }}
                    >
                        {remaining >= 0 ? formatNis(remaining) : `-${formatNis(Math.abs(remaining))}`}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                            fontSize: '0.875rem'
                        }}
                    >
                        {income > 0 ? `${((remaining / income) * 100).toFixed(0)}%` : '—'}
                    </Typography>
                </Box>
            </Box>

            {/* Progress Bar */}
            <Box position="relative" mb={1}>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(usedPercent, 100)}
                    sx={{
                        height: 12,
                        borderRadius: 3,
                        backgroundColor: alpha(theme.palette.grey[300], 0.3),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: theme.palette.primary.main,
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }
                    }}
                />
            </Box>

            {/* Percentage */}
            <Box display="flex" justifyContent="center" alignItems="center">
                <Typography
                    variant="body2"
                    sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 600
                    }}
                >
                    {usedPercent.toFixed(0)}% of budget used
                </Typography>
            </Box>
        </Paper>
    );
};

