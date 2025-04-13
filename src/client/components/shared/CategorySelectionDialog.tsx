import React from 'react';
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
  alpha
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
  
  const handleCategoryClick = (category: string) => {
    onSelectCategory(category);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Select Category</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <List disablePadding>
          {CATEGORIES.map((category, index) => (
            <React.Fragment key={category}>
              <ListItem 
                onClick={() => handleCategoryClick(category)}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                  cursor: 'pointer'
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
