import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    useTheme
} from '@mui/material';
import { InvestmentSettings, getInvestmentSettings, saveInvestmentSettings, InvestmentType } from '../../utils/investmentStorage';

interface InvestmentSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (settings: InvestmentSettings) => void;
}

export const InvestmentSettingsDialog: React.FC<InvestmentSettingsDialogProps> = ({
    open,
    onClose,
    onSave
}) => {
    const theme = useTheme();
    const [settings, setSettings] = useState<InvestmentSettings>({
        monthlyAmount: 0,
        percentage: 0,
        type: 'amount',
        enabled: false
    });

    useEffect(() => {
        if (open) {
            const stored = getInvestmentSettings();
            setSettings(stored);
        }
    }, [open]);

    const handleSave = () => {
        saveInvestmentSettings(settings);
        onSave(settings);
        onClose();
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setSettings(prev => ({ ...prev, monthlyAmount: Math.max(0, value) }));
    };

    const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setSettings(prev => ({ ...prev, percentage: Math.max(0, Math.min(100, value)) }));
    };

    const handleTypeChange = (_: React.MouseEvent<HTMLElement>, newType: InvestmentType | null) => {
        if (newType !== null) {
            setSettings(prev => ({ ...prev, type: newType }));
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>
                Investment Budget Settings
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.enabled}
                                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                                color="primary"
                            />
                        }
                        label="Enable Investment Budget"
                        sx={{ mb: 3 }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Set a monthly investment that will be included in your expenses and deducted from your remaining budget.
                    </Typography>

                    {/* Type Toggle */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 3
                        }}
                    >
                        <ToggleButtonGroup
                            value={settings.type}
                            exclusive
                            onChange={handleTypeChange}
                            disabled={!settings.enabled}
                            sx={{
                                '& .MuiToggleButton-root': {
                                    px: 3,
                                    py: 1,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&.Mui-selected': {
                                        background: theme.palette.primary.main,
                                        color: '#fff',
                                        '&:hover': {
                                            background: theme.palette.primary.dark
                                        }
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="amount">
                                💰 Fixed Amount
                            </ToggleButton>
                            <ToggleButton value="percentage">
                                📊 Percentage
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Amount Input */}
                    {settings.type === 'amount' && (
                        <TextField
                            fullWidth
                            label="Monthly Investment Amount"
                            type="number"
                            value={settings.monthlyAmount || ''}
                            onChange={handleAmountChange}
                            disabled={!settings.enabled}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                            }}
                            inputProps={{
                                min: 0,
                                step: 100
                            }}
                            helperText={settings.enabled ? "Fixed amount applied per month" : "Enable to set investment"}
                        />
                    )}

                    {/* Percentage Input */}
                    {settings.type === 'percentage' && (
                        <TextField
                            fullWidth
                            label="Investment Percentage"
                            type="number"
                            value={settings.percentage || ''}
                            onChange={handlePercentageChange}
                            disabled={!settings.enabled}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                            inputProps={{
                                min: 0,
                                max: 100,
                                step: 1
                            }}
                            helperText={settings.enabled ? "Percentage of total monthly budget" : "Enable to set investment"}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

