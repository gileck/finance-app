import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Paper,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';
import PhoneIcon from '@mui/icons-material/Phone';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import RepeatIcon from '@mui/icons-material/Repeat';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FlightIcon from '@mui/icons-material/Flight';
import CodeIcon from '@mui/icons-material/Code';
import { CardItem } from '@/apis/cardItems/types';
import { getCategoryIcon, getCategoryColor, formatCurrency } from '@/client/utils/categoryUtils';

interface ItemDetailsDialogProps {
  open: boolean;
  item: CardItem | null;
  onClose: () => void;
  onEdit: (item: CardItem) => void;
}

// Format date and time
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Format date as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  // Format time as HH:MM
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({
  open,
  item,
  onClose,
  onEdit
}) => {
  const theme = useTheme();
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  
  if (!item) {
    return null;
  }
  
  const color = getCategoryColor(item.Category, theme);
  
  // Check if the item has the Details property
  const hasDetails = item.Details && (item.Details.Address || item.Details.Phone);
  
  // Open JSON dialog
  const handleOpenJsonDialog = () => {
    setJsonDialogOpen(true);
  };
  
  // Close JSON dialog
  const handleCloseJsonDialog = () => {
    setJsonDialogOpen(false);
  };
  
  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Typography variant="h6">Transaction Details</Typography>
          <Box>
            <IconButton
              onClick={handleOpenJsonDialog}
              color="default"
              size="small"
              sx={{ mr: 1 }}
              title="View JSON Data"
            >
              <CodeIcon />
            </IconButton>
            <Button
              startIcon={<EditIcon />}
              onClick={() => onEdit(item)}
              color="primary"
            >
              Edit
            </Button>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(color, 0.1), 
                color: color,
                mr: 2,
                width: 48,
                height: 48
              }}
            >
              {getCategoryIcon(item.Category)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {item.DisplayName || item.Name}
              </Typography>
              
              <Chip
                label={item.Category}
                size="small"
                sx={{
                  height: 24,
                  backgroundColor: alpha(color, 0.1),
                  color: color,
                  mt: 0.5
                }}
              />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                ml: 'auto', 
                fontWeight: 'bold',
                color: item.Amount > 0 ? theme.palette.success.main : theme.palette.text.primary
              }}
            >
              {formatCurrency(item.Amount, item.Currency)}
            </Typography>
          </Box>

          { item.DisplayName && <Typography variant="body2" sx={{ fontWeight: 'small' }}>
                Full Name: {item.Name}
              </Typography>}
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 2, mx: -1 }}>
            {/* Basic Transaction Information */}
            <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(item.Date)}
                </Typography>
              </Box>
            </Box>
            
            {/* {item.ChargeDate && (
              <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Charge Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body1">
                      {item.ChargeDate}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )} */}
            
          

            {/* Card Type (if available) */}
            {item.CardId && (
              <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Card
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CreditCardIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body1">
                      {item.CardId} {item.CardType ? `(${item.CardType})` : ''}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            
            
            {/* Transaction Type (if available)
            {item.TransactionType && (
              <Box sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Transaction Type
                  </Typography>
                  <Typography variant="body1">
                    {item.TransactionType}
                  </Typography>
                </Box>
              </Box>
            )} */}
            
            {/* Comments (if available) */}
            {item.Comments && item.Comments.length > 0 && (
              <Box sx={{ width: '100%', p: 1 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Comments
                  </Typography>
                  <Typography variant="body1">
                    {item.Comments.join(', ')}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          
          {/* Location and Contact Details (if available) */}
          {hasDetails && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Merchant Details
              </Typography>
              
              {item.Details?.Address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <PlaceIcon fontSize="small" sx={{ mr: 1, mt: 0.3, color: theme.palette.text.secondary }} />
                  <Typography variant="body2">
                    {item.Details.Address}
                  </Typography>
                </Box>
              )}
              
              {item.Details?.Phone && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  <Typography variant="body2">
                    {item.Details.Phone}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
          
          {/* Transaction Flags */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {item.PendingTransaction && (
              <Chip
                label="Pending Transaction"
                color="warning"
                size="small"
              />
            )}
            
            {item.IsRecurringTransaction && (
              <Chip
                icon={<RepeatIcon />}
                label="Recurring Transaction"
                color="info"
                size="small"
              />
            )}
            
            {item.IsCashWithdrawal && (
              <Chip
                icon={<AttachMoneyIcon />}
                label="Cash Withdrawal"
                color="secondary"
                size="small"
              />
            )}
            
            {item.IsCardPresent && (
              <Chip
                icon={<CreditCardIcon />}
                label="Card Present"
                color="default"
                size="small"
              />
            )}
            
            {item.IsAbroadTransaction && (
              <Chip
                icon={<FlightIcon />}
                label="Abroad Transaction"
                color="primary"
                size="small"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* JSON Data Dialog */}
      <Dialog
        open={jsonDialogOpen}
        onClose={handleCloseJsonDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Raw JSON Data
          <Typography variant="subtitle2" color="text.secondary">
            For debugging purposes
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              fontFamily: 'monospace', 
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
              backgroundColor: alpha(theme.palette.primary.main, 0.05)
            }}
          >
            {JSON.stringify(item, null, 2)}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseJsonDialog}>Close</Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(item, null, 2));
            }}
            color="primary"
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
