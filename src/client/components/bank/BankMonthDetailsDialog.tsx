import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider } from '@mui/material';
import { BankItem } from '@/apis/bankItems/types';

interface BankMonthDetailsDialogProps {
  open: boolean;
  item: BankItem | null;
  onClose: () => void;
}

export const BankMonthDetailsDialog: React.FC<BankMonthDetailsDialogProps> = ({ open, item, onClose }) => {
  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bank Transaction Details</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">Date</Typography>
          <Typography variant="body1" fontWeight={500}>{item.Date}</Typography>
        </Box>
        <Divider />
        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary">Description</Typography>
          <Typography variant="body1" fontWeight={500}>{item.Description}</Typography>
        </Box>
        <Divider />
        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
          <Typography variant="body1" fontWeight={500} color={item.Amount >= 0 ? 'success.main' : 'error.main'}>
            {item.Amount >= 0 ? '+' : ''}{item.Amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Typography>
        </Box>
        <Divider />
        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary">Balance</Typography>
          <Typography variant="body1" fontWeight={500}>{item.Balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
        </Box>
        <Divider />
        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary">Category</Typography>
          <Typography variant="body1" fontWeight={500}>{item.Category}</Typography>
        </Box>
        <Divider />
        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary">Type</Typography>
          <Typography variant="body1" fontWeight={500}>{item.type}</Typography>
        </Box>
        <Divider />
        <Box my={2}>
          <Typography variant="subtitle2" color="text.secondary">Raw Date</Typography>
          <Typography variant="body1" fontWeight={500}>{item.RawDate}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};
