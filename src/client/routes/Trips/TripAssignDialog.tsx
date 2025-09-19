import { useEffect, useMemo, useState } from 'react';
import { useTripAssignment } from './hooks/useTripAssignment';
import { getCardItems } from '@/apis/cardItems/client';
import type { CardItem, GetCardItemsResponse } from '@/apis/cardItems/types';
import type { Trip } from '@/apis/trips/types';

interface TripAssignDialogProps {
    open: boolean;
    trip: Trip;
    onClose: () => void;
    onAssigned?: (count: number) => void;
}

export const TripAssignDialog: React.FC<TripAssignDialogProps> = ({ open, trip, onClose, onAssigned }) => {
    const { assign } = useTripAssignment();
    const [items, setItems] = useState<Record<string, CardItem>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>();
    const [selected, setSelected] = useState<Record<string, boolean>>({});

    const load = async () => {
        setLoading(true);
        setError(undefined);
        try {
            const res = await getCardItems({ filter: { startDate: trip.startDate, endDate: trip.endDate }, pagination: { limit: 120 } });
            const data = (res?.data as GetCardItemsResponse) || { cardItems: {} };
            setItems(data.cardItems || {});
            setSelected({});
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (open) void load(); }, [open, trip.startDate, trip.endDate]);

    const itemsArray = useMemo(() => Object.values(items).sort((a, b) => b.Date.localeCompare(a.Date)), [items]);
    const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);

    const handleAssign = async () => {
        const res = await assign(trip.id, selectedIds);
        onAssigned?.(res.updatedCount);
        onClose();
    };

    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }}>
            <div style={{ background: 'white', margin: '5% auto', padding: 16, maxWidth: 800 }}>
                <h3>Assign Transactions to {trip.name}</h3>
                <div>Default filter: {trip.startDate} → {trip.endDate}</div>
                {loading && <div>Loading...</div>}
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <div style={{ maxHeight: 400, overflow: 'auto', marginTop: 12 }}>
                    <table width="100%">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Date</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Currency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsArray.map(i => (
                                <tr key={i.id}>
                                    <td>
                                        <input type="checkbox" checked={!!selected[i.id]} onChange={(e) => setSelected(s => ({ ...s, [i.id]: e.target.checked }))} />
                                    </td>
                                    <td>{i.Date}</td>
                                    <td>{i.DisplayName || i.Name}</td>
                                    <td>{i.Category}</td>
                                    <td style={{ textAlign: 'right' }}>{i.Amount}</td>
                                    <td>{i.Currency}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: 12 }}>
                    <button onClick={onClose} style={{ marginRight: 8 }}>Cancel</button>
                    <button onClick={handleAssign} disabled={selectedIds.length === 0}>Assign {selectedIds.length} items</button>
                </div>
            </div>
        </div>
    );
};


