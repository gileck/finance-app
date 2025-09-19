import { useEffect, useState } from 'react';
import { useRouter } from '@/client/router';
import { getTripSummary } from '@/apis/trips/client';
import type { TripSummary, GetTripSummaryResponse } from '@/apis/trips/types';


export const TripDetails: React.FC = () => {
    const { routeParams, navigate } = useRouter();
    const tripId = routeParams.id;
    const [summary, setSummary] = useState<TripSummary | undefined>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>();

    const load = async () => {
        setLoading(true);
        setError(undefined);
        try {
            const res = await getTripSummary({ id: tripId });
            const data = (res?.data as GetTripSummaryResponse) || {};
            setSummary(data.summary);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tripId) void load();
    }, [tripId]);

    if (loading) return <div>Loading trip...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!summary) return <div>Trip not found</div>;

    const items = Object.values(summary.items);
    const currencyTotals = Object.entries(summary.totals.totalByCurrency);

    const fmt = (amount: number, currency: string) => {
        const rounded = Math.round(amount);
        if (currency.toUpperCase() === 'NIS' || currency.toUpperCase() === 'ILS' || currency === '₪') {
            return `₪${rounded.toLocaleString()}`;
        }
        return `${rounded.toLocaleString()} ${currency}`;
    };

    return (
        <div style={{ padding: 16 }}>
            <button onClick={() => navigate('/trips')}>Back</button>
            <h2>{summary.trip.name}</h2>
            <div>
                {summary.trip.location ? `${summary.trip.location} · ` : ''}
                {summary.trip.startDate} → {summary.trip.endDate}
            </div>
            <h3 style={{ marginTop: 16 }}>Totals</h3>
            <div>Total (NIS): {fmt(summary.totals.totalNis, 'NIS')}</div>
            <ul>
                {currencyTotals.map(([cur, total]) => (
                    <li key={cur}>{cur}: {fmt(total, cur)}</li>
                ))}
            </ul>
            <h3>Categories</h3>
            <ul>
                {summary.categories.map((c) => (
                    <li key={c.category}>{c.category}: {fmt(c.totalNis, 'NIS')} ({c.count})</li>
                ))}
            </ul>
            <h3>Transactions</h3>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Currency</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((i) => (
                        <tr key={i.id}>
                            <td>{i.Date}</td>
                            <td>{i.DisplayName || i.Name}</td>
                            <td>{i.Category}</td>
                            <td style={{ textAlign: 'right' }}>{fmt(i.Amount, i.Currency)}</td>
                            <td>{i.Currency}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


