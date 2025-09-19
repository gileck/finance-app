import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack
} from '@mui/material';
import type { Trip } from '@/apis/trips/types';

interface TripEditDialogProps {
    open: boolean;
    trip?: Trip | null;
    onClose: () => void;
    onCreate: (input: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void> | void;
    onUpdate: (trip: Trip) => Promise<void> | void;
}

export const TripEditDialog: React.FC<TripEditDialogProps> = ({ open, trip, onClose, onCreate, onUpdate }) => {
    const isEdit = useMemo(() => !!trip, [trip]);
    const [name, setName] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        if (open) {
            setSaving(false);
            if (trip) {
                setName(trip.name || '');
                setLocation(trip.location || '');
                setStartDate(trip.startDate || '');
                setEndDate(trip.endDate || '');
            } else {
                setName('');
                setLocation('');
                setStartDate('');
                setEndDate('');
            }
        }
    }, [open, trip]);

    const handleSubmit = async () => {
        if (!name.trim() || !startDate || !endDate) {
            return;
        }
        setSaving(true);
        try {
            if (isEdit && trip) {
                await onUpdate({ ...trip, name: name.trim(), location: location.trim() || undefined, startDate, endDate });
            } else {
                await onCreate({ name: name.trim(), location: location.trim() || undefined, startDate, endDate, id: '', createdAt: '', updatedAt: '' } as unknown as Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>);
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Edit Trip' : 'New Trip'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={0.5}>
                    <TextField
                        label="Trip Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        inputProps={{ minLength: 2 }}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Location (optional)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        fullWidth
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                            fullWidth
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            required
                            fullWidth
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="text" sx={{ minHeight: 44 }}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving || !name.trim() || !startDate || !endDate} variant="contained" sx={{ minHeight: 44 }}>
                    {isEdit ? 'Save' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TripEditDialog;


