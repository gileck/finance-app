import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Divider, Snackbar } from '@mui/material';
import { getBankItems, getMonthlyBankTotals } from '@/apis/bankItems/client';
import { BankItem, MonthlyBankTotal } from '@/apis/bankItems/types';
import { BankMonthsList } from '../../components/bank/BankMonthsList';
import { BankMonthlyAverageBox } from '../../components/bank/BankMonthlyAverageBox';

export const BankPage: React.FC = () => {
  const [bankItems, setBankItems] = useState<Record<string, BankItem>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyBankTotal[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, open: boolean}>({
    message: '',
    open: false
  });

  // Fetch all bank items
  const fetchBankItems = async () => {
    setLoadingItems(true);
    try {
      const response = await getBankItems();
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setBankItems(response.data.bankItems);
      }
    } catch (err) {
      setError(`Failed to fetch bank items: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingItems(false);
    }
  };

  // Fetch monthly totals
  const fetchMonthlyTotals = async () => {
    setLoadingTotals(true);
    try {
      const response = await getMonthlyBankTotals({});
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setMonthlyTotals(response.data.monthlyTotals);
      }
    } catch (err) {
      setError(`Failed to fetch monthly totals: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingTotals(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBankItems();
    fetchMonthlyTotals();
  }, []);

  // Handle item update
  const handleItemUpdated = (updatedItem: BankItem) => {
    // Update local state
    setBankItems(prevItems => ({
      ...prevItems,
      [updatedItem.id]: updatedItem
    }));

    // Show notification
    setNotification({
      message: 'Bank transaction updated successfully',
      open: true
    });

    // Refresh monthly totals to reflect the changes
    fetchMonthlyTotals();
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Bank Transactions (Raw Data)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Monthly Averages Box */}
      <BankMonthlyAverageBox 
        items={bankItems} 
        loading={loadingItems} 
      />
      
      <BankMonthsList
        months={monthlyTotals}
        items={bankItems}
        loading={loadingItems || loadingTotals}
        onItemUpdated={handleItemUpdated}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Box>
  );
};

export { BankPage as default };
