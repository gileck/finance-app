import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress, Divider, useTheme, Chip, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { MonthlyBankTotal, BankItem } from '@/apis/bankItems/types';
import { BankMonthDetailsDialog } from './BankMonthDetailsDialog';

interface BankMonthsListProps {
  months: MonthlyBankTotal[];
  items: Record<string, BankItem>;
  loading: boolean;
}

export const BankMonthsList: React.FC<BankMonthsListProps> = ({ months, items, loading }) => {
  const theme = useTheme();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BankItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleExpand = (monthKey: string) => {
    setExpandedMonth(expandedMonth === monthKey ? null : monthKey);
  };

  const handleItemClick = (item: BankItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDetailsDialogOpen(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" minHeight={150}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!months.length) {
    return <Typography>No bank transactions found.</Typography>;
  }

  return (
    <Box>
      <List>
        {months.map((month) => {
          const monthKey = `${month.year}-${month.month}`;
          const monthItems = Object.values(items).filter(item => {
            const date = new Date(item.Date);
            return date.getFullYear() === month.year && (date.getMonth() + 1).toString() === month.month;
          });
          return (
            <React.Fragment key={monthKey}>
              <ListItem button onClick={() => handleExpand(monthKey)} sx={{ bgcolor: expandedMonth === monthKey ? theme.palette.action.selected : undefined }}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" sx={{ flex: 1 }}>{month.monthName}</Typography>
                      <Chip label={`₪${month.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="primary" size="small" sx={{ ml: 2 }} />
                      <IconButton size="small" sx={{ ml: 1 }}>
                        {expandedMonth === monthKey ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  }
                />
              </ListItem>
              <Collapse in={expandedMonth === monthKey} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                  {monthItems.length === 0 ? (
                    <Typography color="text.secondary">No transactions for this month.</Typography>
                  ) : (
                    <List dense>
                      {monthItems.map(item => (
                        <ListItem key={item.id} button onClick={() => handleItemClick(item)}>
                          <ListItemText
                            primary={<Typography fontWeight={500}>{item.Description}</Typography>}
                            secondary={<>
                              <Typography component="span" color="text.secondary">{item.Date}</Typography>
                              <Typography component="span" color={item.Amount >= 0 ? 'success.main' : 'error.main'} sx={{ ml: 1 }}>
                                {item.Amount >= 0 ? '+' : ''}{item.Amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </Typography>
                              <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>({item.Category})</Typography>
                            </>}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Collapse>
              <Divider component="li" sx={{ borderStyle: 'dashed' }} />
            </React.Fragment>
          );
        })}
      </List>
      <BankMonthDetailsDialog open={detailsDialogOpen} item={selectedItem} onClose={handleDialogClose} />
    </Box>
  );
};
