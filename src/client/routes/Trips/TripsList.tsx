import { useEffect, useState } from 'react';
import { useRouter } from '@/client/router';
import { getTrips, createTrip, updateTrip, deleteTrip, getTripSummary } from '@/apis/trips/client';
import type { Trip, GetTripsResponse, CreateTripRequest, UpdateTripRequest, GetTripSummaryResponse } from '@/apis/trips/types';
import { TripEditDialog } from './TripEditDialog';

export const TripsList: React.FC = () => {
    const router = useRouter();
    const [trips, setTrips] = useState<Record<string, Trip>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>();
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [editTrip, setEditTrip] = useState<Trip | null>(null);
    const [totals, setTotals] = useState<Record<string, number>>({});

    const loadTrips = async () => {
        setLoading(true);
        setError(undefined);
        try {
            const res = await getTrips({});
            const data = (res?.data as GetTripsResponse) || { trips: {} };
            setTrips(data.trips || {});
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadTrips();
    }, []);

    const handleCreate = async (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            await createTrip({ trip } as CreateTripRequest);
            await loadTrips();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleUpdate = async (trip: Trip) => {
        try {
            await updateTrip({ trip } as UpdateTripRequest);
            await loadTrips();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTrip({ id });
            await loadTrips();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const tripArray = Object.values(trips).sort((a, b) => b.startDate.localeCompare(a.startDate));

    // Load totals for trips
    useEffect(() => {
        const loadTotals = async () => {
            const entries = await Promise.all(tripArray.map(async (t) => {
                try {
                    const res = await getTripSummary({ id: t.id });
                    const data = (res?.data as GetTripSummaryResponse) || {};
                    const total = data.summary?.totals.totalNis ?? 0;
                    return [t.id, total] as [string, number];
                } catch {
                    return [t.id, 0] as [string, number];
                }
            }));
            setTotals(Object.fromEntries(entries));
        };
        if (tripArray.length > 0) {
            void loadTotals();
        } else {
            setTotals({});
        }
    }, [tripArray.map(t => t.id).join(',')]);

    const formatNis = (amount: number) => `₪${Math.round(amount).toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;

    return (
        <div style={{ padding: 16 }}>
            {loading && (
                <div>Loading trips...</div>
            )}
            {!loading && error && (
                <div style={{ color: '#b00020' }}>Error: {error}</div>
            )}
            {!loading && !error && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Trips</h2>
                        <button onClick={() => { setEditTrip(null); setEditDialogOpen(true); }}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: '#007AFF',
                                color: 'white',
                                border: 'none',
                                minHeight: 44,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease-in-out'
                            }}>+ New Trip</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {tripArray.map(trip => (
                            <div key={trip.id} style={{
                                borderRadius: 16,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                background: 'var(--card-bg, #fff)',
                                padding: 16
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div style={{ fontSize: 18, fontWeight: 600 }}>{trip.name}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{formatNis(totals[trip.id] || 0)}</div>
                                </div>
                                <div style={{ color: '#666', marginTop: 4 }}>{trip.location || '—'}</div>
                                <div style={{ marginTop: 8, fontSize: 14 }}>{trip.startDate} → {trip.endDate}</div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const path = `/trips/${trip.id}`;
                                            try {
                                                router.navigate(path);
                                            } catch {
                                                if (typeof window !== 'undefined') {
                                                    window.history.pushState(null, '', path);
                                                }
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            borderRadius: 12,
                                            background: '#34C759',
                                            color: 'white',
                                            border: 'none',
                                            minHeight: 44
                                        }}
                                    >
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditTrip(trip); setEditDialogOpen(true); }}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 12,
                                            background: 'transparent',
                                            border: '1px solid rgba(0,0,0,0.12)'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(trip.id)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 12,
                                            background: 'transparent',
                                            color: '#d32f2f',
                                            border: '1px solid rgba(0,0,0,0.12)'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <TripEditDialog
                open={editDialogOpen}
                trip={editTrip}
                onClose={() => setEditDialogOpen(false)}
                onCreate={async (input) => { await handleCreate(input); }}
                onUpdate={async (t) => { await handleUpdate(t); }}
            />
        </div>
    );
};


