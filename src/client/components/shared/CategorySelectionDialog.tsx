import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  alpha,
  TextField,
  Autocomplete,
  Box,
  Typography
} from '@mui/material';
import { getCategoryIcon } from '@/client/utils/categoryUtils';

interface CategorySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}

// Available categories (same as in CardItemEditDialog)
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

export const CategorySelectionDialog: React.FC<CategorySelectionDialogProps> = ({
  open,
  onClose,
  onSelectCategory
}) => {
  const theme = useTheme();
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const handleCategorySelect = (category: string | null) => {
    if (category) {
      setSelectedCategory(category);
    }
  };
  
  const handleSubmit = () => {
    if (selectedCategory) {
      onSelectCategory(selectedCategory);
      onClose();
    }
  };
  
  // Reset state when dialog opens or closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue('');
      setSelectedCategory(null);
    }
  }, [open]);
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Select Category</DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <Autocomplete
          value={selectedCategory}
          onChange={(_, newValue) => handleCategorySelect(newValue)}
          inputValue={searchValue}
          onInputChange={(_, newInputValue) => setSearchValue(newInputValue)}
          options={CATEGORIES}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Search categories" 
              variant="outlined" 
              fullWidth
              autoFocus
            />
          )}
          renderOption={(props, option) => (
            <ListItem {...props} key={option}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {getCategoryIcon(option)}
              </ListItemIcon>
              <ListItemText primary={option} />
            </ListItem>
          )}
          fullWidth
          disablePortal
          autoHighlight
          blurOnSelect
        />
        
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
          All Categories
        </Typography>
        
        <Box sx={{ maxHeight: '300px', overflow: 'auto', mt: 1 }}>
          <List disablePadding>
            {CATEGORIES.map((category, index) => (
              <React.Fragment key={category}>
                <ListItem 
                  onClick={() => {
                    setSelectedCategory(category);
                    handleCategorySelect(category);
                  }}
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === category ? 
                      alpha(theme.palette.primary.main, 0.1) : 'transparent'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getCategoryIcon(category)}
                  </ListItemIcon>
                  <ListItemText primary={category} />
                </ListItem>
                {index < CATEGORIES.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!selectedCategory}
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
};
