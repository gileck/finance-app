export interface Trip {
    id: string;
    name: string;
    location?: string;
    startDate: string; // ISO date inclusive
    endDate: string;   // ISO date inclusive
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetTripsRequest {
    filter?: { search?: string };
}

export interface GetTripsResponse {
    trips: Record<string, Trip>;
    error?: string;
}

export interface GetTripByIdRequest { id: string; }
export interface GetTripByIdResponse { trip?: Trip; error?: string; }

export interface CreateTripRequest { trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>; }
export interface CreateTripResponse { success: boolean; trip?: Trip; error?: string; }

export interface UpdateTripRequest { trip: Trip; }
export interface UpdateTripResponse { success: boolean; trip?: Trip; error?: string; }

export interface DeleteTripRequest { id: string; }
export interface DeleteTripResponse { success: boolean; error?: string; }

export interface AssignCardItemsToTripRequest { tripId: string; cardItemIds: string[]; }
export interface AssignCardItemsToTripResponse { success: boolean; updatedCount: number; error?: string; }

export interface UnassignCardItemsFromTripRequest { cardItemIds: string[]; }
export interface UnassignCardItemsFromTripResponse { success: boolean; updatedCount: number; error?: string; }

export interface GetTripSummaryRequest { id: string; }
export interface TripSummary {
    trip: Trip;
    totals: {
        totalNis: number;
        totalByCurrency: Record<string, number>;
    };
    categories: Array<{ category: string; totalNis: number; count: number }>;
    items: Record<string, import('../cardItems/types').CardItem>;
}
export interface GetTripSummaryResponse { summary?: TripSummary; error?: string; }


