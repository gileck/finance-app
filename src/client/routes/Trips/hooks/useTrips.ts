import { useCallback, useEffect, useState } from 'react';
import {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripSummary,
} from '@/apis/trips/client';
import type {
    Trip,
    GetTripsResponse,
    GetTripByIdResponse,
    CreateTripRequest,
    UpdateTripRequest,
    DeleteTripRequest,
    GetTripSummaryResponse,
    TripSummary,
} from '@/apis/trips/types';

export const useTrips = () => {
    const [trips, setTrips] = useState<Record<string, Trip>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined>();

    const reload = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const create = useCallback(async (input: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
        await createTrip({ trip: input } as CreateTripRequest);
        await reload();
    }, [reload]);

    const update = useCallback(async (trip: Trip) => {
        await updateTrip({ trip } as UpdateTripRequest);
        await reload();
    }, [reload]);

    const remove = useCallback(async (id: string) => {
        await deleteTrip({ id } as DeleteTripRequest);
        await reload();
    }, [reload]);

    const fetchById = useCallback(async (id: string): Promise<Trip | undefined> => {
        const res = await getTripById({ id });
        const data = (res?.data as GetTripByIdResponse) || {};
        return data.trip;
    }, []);

    const fetchSummary = useCallback(async (id: string): Promise<TripSummary | undefined> => {
        const res = await getTripSummary({ id });
        const data = (res?.data as GetTripSummaryResponse) || {};
        return data.summary;
    }, []);

    return { trips, loading, error, reload, create, update, remove, fetchById, fetchSummary } as const;
};


