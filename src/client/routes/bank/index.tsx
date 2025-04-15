import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Divider } from '@mui/material';
import { getBankItems, getMonthlyBankTotals } from '@/apis/bankItems/client';
import { BankItem, MonthlyBankTotal } from '@/apis/bankItems/types';
import { BankMonthsList } from '../../components/bank/BankMonthsList';

export const BankPage: React.FC = () => {
  const [bankItems, setBankItems] = useState<Record<string, BankItem>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyBankTotal[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all bank items
  useEffect(() => {
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
    fetchBankItems();
  }, []);

  // Fetch monthly totals
  useEffect(() => {
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
    fetchMonthlyTotals();
  }, []);

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Bank Transactions (Raw Data)
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {error && <Alert severity="error">{error}</Alert>}
      <BankMonthsList
        months={monthlyTotals}
        items={bankItems}
        loading={loadingItems || loadingTotals}
      />
    </Box>
  );
};

export { BankPage as default };
