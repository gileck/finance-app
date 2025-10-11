import React from 'react';
import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

interface Insight {
    type: 'positive' | 'warning' | 'info';
    message: string;
}

interface SmartInsightsProps {
    insights: Insight[];
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({ insights }) => {
    const theme = useTheme();

    const getInsightConfig = (type: Insight['type']) => {
        switch (type) {
            case 'positive':
                return {
                    icon: <TrendingUpIcon fontSize="small" />,
                    color: '#22C55E',
                    bgColor: alpha('#22C55E', 0.05),
                    borderColor: alpha('#22C55E', 0.2)
                };
            case 'warning':
                return {
                    icon: <WarningAmberIcon fontSize="small" />,
                    color: '#F59E0B',
                    bgColor: alpha('#F59E0B', 0.05),
                    borderColor: alpha('#F59E0B', 0.2)
                };
            case 'info':
                return {
                    icon: <InfoIcon fontSize="small" />,
                    color: '#6366F1',
                    bgColor: alpha('#6366F1', 0.05),
                    borderColor: alpha('#6366F1', 0.2)
                };
        }
    };

    if (insights.length === 0) return null;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 4,
                background: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
        >
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <LightbulbIcon sx={{ color: '#F59E0B', fontSize: 24 }} />
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        fontSize: '1.125rem'
                    }}
                >
                    Smart Insights
                </Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={1.5}>
                {insights.map((insight, index) => {
                    const config = getInsightConfig(insight.type);
                    return (
                        <Box
                            key={index}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                background: config.bgColor,
                                border: `1px solid ${config.borderColor}`,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'translateX(4px)',
                                    boxShadow: `0 4px 12px ${alpha(config.color, 0.15)}`
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 2,
                                    background: config.color,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                {config.icon}
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.primary,
                                    fontSize: '0.875rem',
                                    lineHeight: 1.6,
                                    flex: 1
                                }}
                            >
                                {insight.message}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

