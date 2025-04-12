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
import { CardItem } from '@/apis/cardItems/types';

interface CardItemEditDialogProps {
  open: boolean;
  cardItem: CardItem | null;
  onClose: () => void;
  onSave: (cardItem: CardItem) => Promise<void>;
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
  'Transportation',
  'Travel',
  'Utilities',
];

// Available currencies
const CURRENCIES = ['NIS', 'USD', 'EUR', 'GBP'];

export const CardItemEditDialog: React.FC<CardItemEditDialogProps> = ({
  open,
  cardItem,
  onClose,
  onSave
}) => {
  const [editedItem, setEditedItem] = useState<CardItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Update local state when cardItem changes
  useEffect(() => {
    if (cardItem) {
      setEditedItem({ ...cardItem });
    } else {
      setEditedItem(null);
    }
    // Reset loading state when dialog opens/closes
    setLoading(false);
  }, [cardItem, open]);

  // Handle form field changes
  const handleFieldChange = (field: keyof CardItem, value: string | number | boolean) => {
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
        console.error('Error saving card item:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!editedItem) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>Edit Card Item</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
            <TextField
              label="Name"
              fullWidth
              value={editedItem.Name}
              onChange={(e) => handleFieldChange('Name', e.target.value)}
              margin="normal"
              disabled={loading}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
            <TextField
              label="Display Name (Optional)"
              fullWidth
              value={editedItem.DisplayName || ''}
              onChange={(e) => handleFieldChange('DisplayName', e.target.value)}
              margin="normal"
              disabled={loading}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={new Date(editedItem.Date).toISOString().split('T')[0]}
              onChange={(e) => handleFieldChange('Date', e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              disabled={loading}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
            <FormControl fullWidth margin="normal" disabled={loading}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
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
              fullWidth
              value={editedItem.Amount}
              onChange={(e) => handleFieldChange('Amount', parseFloat(e.target.value))}
              margin="normal"
              disabled={loading}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
            <FormControl fullWidth margin="normal" disabled={loading}>
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select
                labelId="currency-label"
                value={editedItem.Currency}
                onChange={(e) => handleFieldChange('Currency', e.target.value)}
                label="Currency"
              >
                {CURRENCIES.map(currency => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              label="Comments"
              fullWidth
              multiline
              rows={3}
              value={editedItem.Comments || ''}
              onChange={(e) => handleFieldChange('Comments', e.target.value)}
              margin="normal"
              disabled={loading}
            />
          </Box>
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
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
