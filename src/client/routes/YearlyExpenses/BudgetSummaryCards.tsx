import React from 'react';
import { Box, Paper, Typography, Tooltip, alpha, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { formatNis } from '@/common/currency';

interface BudgetSummaryCardsProps {
    income: number;
    expenses: number;
    balance: number;
    loading?: boolean;
}

export const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({
    income,
    expenses,
    balance,
    loading = false
}) => {
    const theme = useTheme();

    const cards = [
        {
            title: 'Income',
            value: income,
            icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
            color: '#22C55E',
            bgGradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            trend: '+5%'
        },
        {
            title: 'Expenses',
            value: expenses,
            icon: <TrendingDownIcon sx={{ fontSize: 32 }} />,
            color: '#EF4444',
            bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            trend: '-3%'
        },
        {
            title: 'Balance',
            value: balance,
            icon: <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />,
            color: '#6366F1',
            bgGradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            trend: '+8%'
        }
    ];

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
                mb: 3
            }}
        >
            {cards.map((card) => (
                <Tooltip
                    key={card.title}
                    title={`${card.trend} compared to last period`}
                    arrow
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            background: alpha(card.color, 0.05),
                            border: `1px solid ${alpha(card.color, 0.1)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 24px ${alpha(card.color, 0.15)}`,
                                border: `1px solid ${alpha(card.color, 0.3)}`
                            },
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '120px',
                                height: '120px',
                                background: card.bgGradient,
                                opacity: 0.1,
                                borderRadius: '50%',
                                transform: 'translate(40px, -40px)',
                                transition: 'transform 0.3s ease'
                            },
                            '&:hover::before': {
                                transform: 'translate(30px, -30px) scale(1.1)'
                            }
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 3,
                                    background: card.bgGradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    boxShadow: `0 4px 12px ${alpha(card.color, 0.3)}`
                                }}
                            >
                                {card.icon}
                            </Box>
                            <Box
                                sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    background: alpha(card.color, 0.1),
                                    color: card.color,
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}
                            >
                                {card.trend}
                            </Box>
                        </Box>

                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                mb: 0.5,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {card.title}
                        </Typography>

                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                fontSize: { xs: '1.75rem', sm: '2rem' },
                                mb: 0.5
                            }}
                        >
                            {loading ? '...' : formatNis(card.value)}
                        </Typography>
                    </Paper>
                </Tooltip>
            ))}
        </Box>
    );
};

