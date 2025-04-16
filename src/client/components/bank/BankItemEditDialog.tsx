import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { BankItem } from '@/apis/bankItems/types';

interface BankItemEditDialogProps {
  open: boolean;
  bankItem: BankItem | null;
  onClose: () => void;
  onSave: (bankItem: BankItem) => Promise<void>;
}

// Available categories
const CATEGORIES = [
  'ATM',
  'Bills',
  'Bike',
  'Children',
  'Clothing',
  'Donations',
  'Education',
  'Entertainment',
  'Events',
  'Groceries',
  'Hair',
  'Health',
  'Home',
  'IHERB',
  'Institutions',
  'Internet',
  'Money Transfer',
  'Online Shopping',
  'Restaurants',
  'Salary',
  'Transportation',
  'Travel',
  'Utilities',
];

// Available transaction types
const TRANSACTION_TYPES = [
  'Income',
  'Expense',
  'Transfer'
];

export const BankItemEditDialog: React.FC<BankItemEditDialogProps> = ({
  open,
  bankItem,
  onClose,
  onSave
}) => {
  const [editedItem, setEditedItem] = useState<BankItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Update local state when bankItem changes
  useEffect(() => {
    if (bankItem) {
      setEditedItem({ ...bankItem });
    } else {
      setEditedItem(null);
    }
    // Reset loading state when dialog opens/closes
    setLoading(false);
  }, [bankItem, open]);

  // Handle form field changes
  const handleFieldChange = (field: keyof BankItem, value: string | number | boolean) => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        [field]: value
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (editedItem && !loading) {
      setLoading(true);
      try {
        await onSave(editedItem);
      } catch (error) {
        console.error('Error saving bank item:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!editedItem) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Bank Transaction</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          py: 1
        }}>
          {/* Date */}
          <TextField
            label="Date"
            type="date"
            value={editedItem.Date.split('T')[0]}
            onChange={(e) => handleFieldChange('Date', e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />

          {/* Description */}
          <TextField
            label="Description"
            value={editedItem.Description}
            onChange={(e) => handleFieldChange('Description', e.target.value)}
            fullWidth
          />

          {/* Amount and Category in a row */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editedItem.Category}
                  onChange={(e) => handleFieldChange('Category', e.target.value)}
                  label="Category"
                >
                  {CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                label="Amount"
                type="number"
                value={editedItem.Amount}
                onChange={(e) => handleFieldChange('Amount', parseFloat(e.target.value))}
                fullWidth
              />
            </Box>
          </Box>

          {/* Balance and Type in a row */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <TextField
                label="Balance"
                type="number"
                value={editedItem.Balance}
                onChange={(e) => handleFieldChange('Balance', parseFloat(e.target.value))}
                fullWidth
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={editedItem.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  label="Transaction Type"
                >
                  {TRANSACTION_TYPES.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Raw Date */}
          <TextField
            label="Raw Date"
            value={editedItem.RawDate}
            onChange={(e) => handleFieldChange('RawDate', e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
