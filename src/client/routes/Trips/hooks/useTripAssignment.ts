import { useCallback } from 'react';
import { assignCardItemsToTrip, unassignCardItemsFromTrip } from '@/apis/trips/client';
import type {
    AssignCardItemsToTripRequest,
    AssignCardItemsToTripResponse,
    UnassignCardItemsFromTripRequest,
    UnassignCardItemsFromTripResponse,
} from '@/apis/trips/types';

export const useTripAssignment = () => {
    const assign = useCallback(async (tripId: string, cardItemIds: string[]) => {
        const res = await assignCardItemsToTrip({ tripId, cardItemIds } as AssignCardItemsToTripRequest);
        return res.data as AssignCardItemsToTripResponse;
    }, []);

    const unassign = useCallback(async (cardItemIds: string[]) => {
        const res = await unassignCardItemsFromTrip({ cardItemIds } as UnassignCardItemsFromTripRequest);
        return res.data as UnassignCardItemsFromTripResponse;
    }, []);

    return { assign, unassign } as const;
};


