import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  Divider,
  useTheme,
  alpha,
  Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { CardItem } from '@/apis/cardItems/types';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';

interface CategoryItemsDialogProps {
  open: boolean;
  onClose: () => void;
  category: string;
  items: CardItem[];
}

interface NameGroup {
  name: string;
  items: CardItem[];
  totalAmount: number;
}

export const CategoryItemsDialog: React.FC<CategoryItemsDialogProps> = ({
  open,
  onClose,
  category,
  items
}) => {
  const theme = useTheme();
  const color = getCategoryColor(category, theme);
  const currency = items.length > 0 ? items[0].Currency : 'NIS';
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Group items by name
  const groupedByName = React.useMemo(() => {
    const groups: Record<string, NameGroup> = {};

    items.forEach(item => {
      const name = item.DisplayName || item.Name;

      if (!groups[name]) {
        groups[name] = {
          name,
          items: [],
          totalAmount: 0
        };
      }

      groups[name].items.push(item);
      groups[name].totalAmount += item.Amount;
    });

    // Convert to array and sort by absolute total amount (highest first)
    return Object.values(groups)
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));
  }, [items]);

  // Calculate total for this category
  const totalAmount = items.reduce((sum, item) => sum + item.Amount, 0);

  const handleGroupToggle = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 1
      }}>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha(color, 0.1),
              color: color,
              mr: 2
            }}
          >
            {getCategoryIcon(category)}
          </Box>
          <Box>
            <Typography variant="h6">{category}</Typography>
            <Typography variant="body2" color="text.secondary">
              {items.length} transactions · {formatCurrency(totalAmount, currency)}
            </Typography>
          </Box>
        </Box>
        <IconButton edge="end" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <List disablePadding>
          {groupedByName.map((group, groupIndex) => {
            const isExpanded = expandedGroups[group.name] || false;

            return (
              <React.Fragment key={group.name}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleGroupToggle(group.name)}
                >
                  <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                      <IconButton
                        size="small"
                        sx={{ mr: 1, p: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupToggle(group.name);
                        }}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                      <Typography variant="body1" fontWeight="medium">
                        {group.name}
                      </Typography>
                      {group.items.length > 1 && (
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: theme.palette.action.selected,
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ml: 1
                          }}
                        >
                          {group.items.length}
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      color={group.totalAmount >= 0 ? theme.palette.success.main : theme.palette.error.main}
                    >
                      {group.totalAmount >= 0 ? '+' : ''}{formatCurrency(group.totalAmount, currency)}
                    </Typography>
                  </Box>
                </ListItem>

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {group.items.map((item, itemIndex) => (
                      <React.Fragment key={item.id}>
                        <ListItem
                          sx={{
                            py: 1,
                            px: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            bgcolor: alpha(theme.palette.background.default, 0.5)
                          }}
                        >
                          <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Typography variant="caption" color="text.secondary">
                              {new Date(item.Date).toLocaleDateString('en-IL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              color={item.Amount >= 0 ? theme.palette.success.main : theme.palette.error.main}
                            >
                              {item.Amount >= 0 ? '+' : ''}{formatCurrency(item.Amount, currency)}
                            </Typography>
                          </Box>
                          {item.Comments && Array.isArray(item.Comments) && item.Comments.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {item.Comments.join(' · ')}
                            </Typography>
                          )}
                        </ListItem>
                        {itemIndex < group.items.length - 1 && (
                          <Divider component="li" sx={{ ml: 4 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>

                {groupIndex < groupedByName.length - 1 && (
                  <Divider component="li" />
                )}
              </React.Fragment>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
};
