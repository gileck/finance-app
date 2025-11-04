import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, Divider, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { CardItem } from '@/apis/cardItems/types';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { CardItemEditDialog } from '@/client/components/shared/CardItemEditDialog';
import { updateCardItem } from '@/apis/cardItems/client';
import { getCategoryColor } from '@/client/utils/categoryUtils';

type Props = {
  items: CardItem[];
  loading: boolean;
  limit?: number;
};

export const MoneyTransfersMonthList: React.FC<Props> = ({ items, loading, limit = 5 }) => {
  const [activeItem, setActiveItem] = useState<CardItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const transfers = useMemo(() => {
    return items
      .filter(i => i.Category === 'Money Transfer')
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, limit);
  }, [items, limit]);

  const formatCurrency = (amount: number, currency?: string) => {
    const code = (currency || 'NIS').toUpperCase();
    if (code === 'NIS' || code === 'ILS' || currency === '₪') {
      return `₪${Math.round(amount).toLocaleString()}`;
    }
    return `${Math.round(amount).toLocaleString()} ${currency || 'NIS'}`;
  };

  const formatLocalDateTime = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const formatWeekday = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  };

  return (
    <Box component={PaperLike} title="Money Transfers">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : transfers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No transfers this month.</Typography>
      ) : (
        <List dense>
          {transfers.map((item, idx) => (
            <React.Fragment key={item.id}>
              <ListItem onClick={() => { setActiveItem(item); setDetailsOpen(true); }} sx={{ cursor: 'pointer' }}>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Tooltip title={item.Category}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getCategoryColor(item.Category) }} />
                      </Tooltip>
                      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, pr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.DisplayName || item.Name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCurrency(item.Amount, item.Currency)}</Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatWeekday(item.Date)} • {formatLocalDateTime(item.Date)}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="edit" onClick={(e) => { e.stopPropagation(); setActiveItem(item); setEditOpen(true); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {idx < transfers.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      {activeItem && (
        <ItemDetailsDialog
          open={detailsOpen}
          item={activeItem}
          onClose={() => { setDetailsOpen(false); setActiveItem(null); }}
          onEdit={() => { setDetailsOpen(false); setEditOpen(true); }}
          onDelete={() => {}}
        />
      )}
      {activeItem && (
        <CardItemEditDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          cardItem={activeItem}
          onSave={async (updated) => {
            const res = await updateCardItem({ cardItem: updated });
            if (res.data?.success && res.data.cardItem) {
              setEditOpen(false);
            }
          }}
        />
      )}
    </Box>
  );
};

// Lightweight wrapper to mimic DashboardCard styling without importing new component patterns
const PaperLike: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>{title}</Typography>
      {children}
    </Box>
  );
};



